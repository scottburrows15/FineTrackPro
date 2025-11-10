import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FineWithDetails, TeamStats, Notification, FineSubcategory } from "@shared/schema";
import {
  Users,
  Users2,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  PoundSterling,
  Calendar,
  Search,
  Filter,
  PlusCircle,
  Edit,
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import AdminShareLink from "@/components/admin-share-link";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Edit fine form schema
const editFineSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a positive number"),
  description: z.string().optional(),
  subcategoryId: z.string().min(1, "Category is required"),
});

type EditFineFormData = z.infer<typeof editFineSchema>;

export default function AdminHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("unpaid");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);
  const [editingFine, setEditingFine] = useState<FineWithDetails | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ["/api/stats/team"],
  });

  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/team"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unpaidCount = fines.filter((f) => !f.isPaid).length;

  // Filter fines
  const filteredFines = useMemo(() => {
    let result = [...fines];
    if (statusFilter === "unpaid") result = result.filter((f) => !f.isPaid);
    else if (statusFilter === "paid") result = result.filter((f) => f.isPaid);

    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter((f) => f.createdAt && new Date(f.createdAt) >= today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((f) => f.createdAt && new Date(f.createdAt) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter((f) => f.createdAt && new Date(f.createdAt) >= monthAgo);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => {
        const playerName = `${f.player?.firstName || ""} ${f.player?.lastName || ""}`.toLowerCase();
        const description = (f.description || "").toLowerCase();
        return playerName.includes(query) || description.includes(query);
      });
    }
    return result;
  }, [fines, searchQuery, statusFilter, dateFilter]);

  // Mutations
  const markAsPaidMutation = useMutation({
    mutationFn: async (fine: FineWithDetails) => {
      const payload = {
        paymentMethod: "manual",
        transactionId: "Admin Manual Payment",
        notes: "Marked as paid by admin",
        amount: parseFloat(fine.amount),
      };
      const response = await apiRequest("POST", `/api/admin/fines/${fine.id}/record-payment`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Fine Marked as Paid", description: "Fine updated successfully." });
    },
  });

  const deleteFineMutation = useMutation({
    mutationFn: async (fineId: string) => apiRequest("DELETE", `/api/admin/fines/${fineId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      toast({ title: "Fine Deleted", description: "Fine has been removed." });
      setExpandedFineId(null);
    },
  });

  const editFineMutation = useMutation({
    mutationFn: async ({ fineId, data }: { fineId: string; data: EditFineFormData }) => {
      const response = await apiRequest("PUT", `/api/admin/fines/${fineId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      toast({ title: "Fine Updated", description: "Fine has been updated successfully." });
      setEditingFine(null);
    },
  });

  // Fetch subcategories for edit modal
  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories"],
    enabled: !!editingFine,
  });

  if (!user || user.role !== "admin") return null;

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Admin Dashboard"
      unreadNotifications={unreadCount}
      onViewChange={(view) =>
        setLocation(view === "player" ? "/player/home" : "/admin/home")
      }
      canSwitchView={true}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">

        {/* Compact Greeting */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold">Welcome back, {user.firstName}!</h2>
          <p className="text-sm opacity-90">
            Manage fines, track payments, and stay up to date with team activity.
          </p>
        </div>

        {/* Team Share Link - Condensed */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Users2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Invite Players</h3>
                <p className="text-xs text-muted-foreground">Share your team code or link</p>
              </div>
            </div>
            <AdminShareLink />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Players", value: statsLoading ? "-" : stats?.totalPlayers || 0, icon: <Users className="w-6 h-6 text-blue-500" />, color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40" },
            { title: "Outstanding Fines", value: statsLoading ? "-" : formatCurrency(parseFloat(stats?.outstandingFines || "0")), icon: <AlertTriangle className="w-6 h-6 text-orange-500" />, color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/40" },
            { title: "This Month", value: statsLoading ? "-" : formatCurrency(parseFloat(stats?.monthlyCollection || "0")), icon: <PoundSterling className="w-6 h-6 text-green-500" />, color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40" },
            { title: "Unpaid Fines", value: finesLoading ? "-" : unpaidCount, icon: <Calendar className="w-6 h-6 text-purple-500" />, color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40" },
          ].map((item, i) => (
            <Card key={i} className={`p-4 bg-gradient-to-br ${item.color} border border-slate-200 dark:border-slate-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
                {item.icon}
              </div>
            </Card>
          ))}
        </div>

        {/* All Fines Section */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-semibold">All Fines</h3>
              <p className="text-xs text-muted-foreground">Search, filter, and manage team fines</p>
            </div>
            <Button
              onClick={() => setLocation("/admin/fines")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              Issue Fine
            </Button>
          </div>

          {/* Filters inside All Fines */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fines List */}
          {finesLoading ? (
            <p className="text-center py-6 text-muted-foreground">Loading fines...</p>
          ) : filteredFines.length > 0 ? (
            <div className="space-y-3">
              {filteredFines.map((fine) => (
                <Card
                  key={fine.id}
                  className={`p-4 border ${fine.isPaid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{fine.player?.firstName} {fine.player?.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {fine.subcategory?.name || "Fine"} • {formatDate(fine.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(parseFloat(fine.amount))}</p>
                      <Badge className={`text-xs ${fine.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {fine.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>

                  {fine.description && (
                    <p className="text-sm text-muted-foreground mt-2">{fine.description}</p>
                  )}

                  {!fine.isPaid && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Button
                        onClick={() => setEditingFine(fine)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid={`button-edit-fine-${fine.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => markAsPaidMutation.mutate(fine)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-mark-paid-${fine.id}`}
                      >
                        Mark as Paid
                      </Button>
                      <Button
                        onClick={() => deleteFineMutation.mutate(fine.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        data-testid={`button-delete-${fine.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No fines found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Fine Modal */}
      <EditFineModal
        fine={editingFine}
        onClose={() => setEditingFine(null)}
        onSubmit={(data) => {
          if (editingFine) {
            editFineMutation.mutate({ fineId: editingFine.id, data });
          }
        }}
        subcategories={subcategories}
        isLoading={editFineMutation.isPending}
      />
    </AppLayout>
  );
}

// Edit Fine Modal Component
function EditFineModal({
  fine,
  onClose,
  onSubmit,
  subcategories,
  isLoading,
}: {
  fine: FineWithDetails | null;
  onClose: () => void;
  onSubmit: (data: EditFineFormData) => void;
  subcategories: FineSubcategory[];
  isLoading: boolean;
}) {
  const form = useForm<EditFineFormData>({
    resolver: zodResolver(editFineSchema),
    defaultValues: {
      amount: "",
      description: "",
      subcategoryId: "",
    },
  });

  // Reset form when fine changes (only run when fine.id changes)
  useEffect(() => {
    if (fine) {
      form.reset({
        amount: fine.amount,
        description: fine.description || "",
        subcategoryId: fine.subcategoryId,
      });
    }
  }, [fine?.id, form]);

  if (!fine) return null;

  return (
    <Dialog open={!!fine} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Fine</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (£)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      data-testid="input-edit-fine-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-fine-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add notes about this fine"
                      data-testid="input-edit-fine-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-edit-fine"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
                data-testid="button-submit-edit-fine"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}