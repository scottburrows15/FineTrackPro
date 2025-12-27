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
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
  Target,
  BarChart3,
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
  subcategoryId: z.string().min(1, "Subcategory is required"),
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
  const [showStats, setShowStats] = useState(true);

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

  const { data: fundsSummary, isLoading: fundsSummaryLoading } = useQuery<{ inPot: number; settled: number }>({
    queryKey: ["/api/admin/funds-summary"],
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

  // Fetch categories and subcategories for edit modal
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: !!editingFine,
  });

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
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* Reverted Team Sharing Section */}
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

        {/* Stats Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="text-slate-600 dark:text-slate-400"
          >
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="ml-2 text-xs">{showStats ? "Hide" : "Show"} Stats</span>
          </Button>
        </div>

        {/* Enhanced Stats Grid */}
        {showStats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { 
                title: "Total Players", 
                value: statsLoading ? "-" : stats?.totalPlayers || 0, 
                icon: <Users className="w-4 h-4" />, 
                color: "from-indigo-500 to-purple-600",
                bgColor: "bg-gradient-to-br from-indigo-500 to-purple-600",
                testId: "stat-total-players" 
              },
              { 
                title: "Outstanding", 
                value: statsLoading ? "-" : formatCurrency(parseFloat(stats?.outstandingFines || "0")), 
                icon: <AlertTriangle className="w-4 h-4" />, 
                color: "from-amber-500 to-orange-500",
                bgColor: "bg-gradient-to-br from-amber-500 to-orange-500",
                testId: "stat-outstanding-fines" 
              },
              { 
                title: "This Month", 
                value: statsLoading ? "-" : formatCurrency(parseFloat(stats?.monthlyCollection || "0")), 
                icon: <TrendingUp className="w-4 h-4" />, 
                color: "from-emerald-500 to-green-600",
                bgColor: "bg-gradient-to-br from-emerald-500 to-green-600",
                testId: "stat-this-month" 
              },
              { 
                title: "Unpaid Fines", 
                value: finesLoading ? "-" : unpaidCount, 
                icon: <BarChart3 className="w-4 h-4" />, 
                color: "from-rose-500 to-pink-600",
                bgColor: "bg-gradient-to-br from-rose-500 to-pink-600",
                testId: "stat-unpaid-fines" 
              },
              { 
                title: "In Pot", 
                value: fundsSummaryLoading ? "-" : formatCurrency(fundsSummary?.inPot || 0), 
                icon: <Wallet className="w-4 h-4" />, 
                color: "from-cyan-500 to-blue-600",
                bgColor: "bg-gradient-to-br from-cyan-500 to-blue-600",
                testId: "stat-in-pot" 
              },
              { 
                title: "Pending", 
                value: fundsSummaryLoading ? "-" : formatCurrency(fundsSummary?.settled || 0), 
                icon: <Target className="w-4 h-4" />, 
                color: "from-violet-500 to-purple-600",
                bgColor: "bg-gradient-to-br from-violet-500 to-purple-600",
                testId: "stat-pending-balance" 
              },
            ].map((item, i) => (
              <Card key={i} className={`p-3 ${item.bgColor} text-white shadow-lg border-0`} data-testid={item.testId}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/90">{item.title}</p>
                    <p className="text-lg font-bold mt-1 text-white">{item.value}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Fines Management Section */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fines Management</h3>
              <p className="text-xs text-muted-foreground">
                {filteredFines.length} fine{filteredFines.length !== 1 ? 's' : ''} found
                {statusFilter !== 'all' && ` • ${statusFilter} only`}
              </p>
            </div>
            <Button
              onClick={() => setLocation("/admin/fines")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              size="sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Fine</span>
            </Button>
          </div>

          {/* Mobile-Optimized Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full">
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
          </div>

          {/* Enhanced Fines List with White Background Cards */}
          {finesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading fines...</p>
            </div>
          ) : filteredFines.length > 0 ? (
            <div className="space-y-3">
              {filteredFines.map((fine) => (
                <Card
                  key={fine.id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${
                    expandedFineId === fine.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setExpandedFineId(expandedFineId === fine.id ? null : fine.id)}
                >
                  {/* Row 1: Name, Status, Date */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {fine.player?.firstName} {fine.player?.lastName}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={fine.isPaid ? "default" : "destructive"} 
                        className={`text-xs ${fine.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {fine.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                      <span className="text-xs text-slate-500">{formatDate(fine.createdAt)}</span>
                    </div>
                  </div>

                  {/* Row 2: Subcategory */}
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {fine.subcategory?.name || "Fine"} • {formatCurrency(parseFloat(fine.amount))}
                  </div>

                  {/* Row 3: Icon Action Buttons */}
                  {!fine.isPaid && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => markAsPaidMutation.mutate(fine)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                        size="sm"
                        data-testid={`button-mark-paid-${fine.id}`}
                        title="Mark as paid"
                      >
                        <Check className="w-4 h-4" />
                        <span className="sr-only">Mark Paid</span>
                      </Button>
                      <Button
                        onClick={() => deleteFineMutation.mutate(fine.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                        size="sm"
                        data-testid={`button-delete-${fine.id}`}
                        title="Delete fine"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                      <Button
                        onClick={() => setEditingFine(fine)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                        data-testid={`button-edit-fine-${fine.id}`}
                        title="Edit fine"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </div>
                  )}

                  {/* Expandable Description */}
                  {expandedFineId === fine.id && fine.description && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{fine.description}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No fines found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                variant="outline" 
                className="mt-3"
              >
                Clear Filters
              </Button>
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
        categories={categories}
        subcategories={subcategories}
        isLoading={editFineMutation.isPending}
      />
    </AppLayout>
  );
}

// Edit Fine Modal Component (unchanged)
function EditFineModal({
  fine,
  onClose,
  onSubmit,
  categories,
  subcategories,
  isLoading,
}: {
  fine: FineWithDetails | null;
  onClose: () => void;
  onSubmit: (data: EditFineFormData) => void;
  categories: any[];
  subcategories: FineSubcategory[];
  isLoading: boolean;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const form = useForm<EditFineFormData>({
    resolver: zodResolver(editFineSchema),
    defaultValues: {
      amount: "",
      description: "",
      subcategoryId: "",
    },
  });

  // Filter subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategoryId) return subcategories;
    return subcategories.filter(sub => sub.categoryId === selectedCategoryId);
  }, [selectedCategoryId, subcategories]);

  // Reset form and set category when fine changes
  useEffect(() => {
    if (fine && subcategories.length > 0) {
      const currentSubcategory = subcategories.find(sub => sub.id === fine.subcategoryId);
      const categoryId = currentSubcategory?.categoryId || "";
      
      setSelectedCategoryId(categoryId);
      form.reset({
        amount: fine.amount,
        description: fine.description || "",
        subcategoryId: fine.subcategoryId,
      });
    }
  }, [fine?.id, subcategories, form]);

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

            {/* Category Selector */}
            <div>
              <FormLabel>Category</FormLabel>
              <Select 
                value={selectedCategoryId} 
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  // Clear subcategory when category changes
                  form.setValue("subcategoryId", "");
                }}
              >
                <SelectTrigger data-testid="select-edit-fine-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory Selector */}
            <FormField
              control={form.control}
              name="subcategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-fine-subcategory">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSubcategories.map((sub) => (
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