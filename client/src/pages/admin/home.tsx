import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { FineWithDetails, TeamStats, Notification, FineSubcategory, Team } from "@shared/schema";
import {
  Search,
  PlusCircle,
  Edit,
  Check,
  Trash2,
  Share2,
  Filter,
  Wallet,
  AlertCircle,
  Users,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  // Queries
  const { data: team } = useQuery<Team>({
    queryKey: ["/api/team/info"],
  });

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

  const { data: fundsSummary, isLoading: fundsSummaryLoading } = useQuery<{ inPot: number; settled: number; pendingPaymentsCount?: number }>({
    queryKey: ["/api/admin/funds-summary"],
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter fines logic
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
        const nameToSearch = f.player?.nickname || `${f.player?.firstName || ""} ${f.player?.lastName || ""}`;
        const description = (f.description || "").toLowerCase();
        return nameToSearch.toLowerCase().includes(query) || description.includes(query);
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funds-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      toast({ title: "Success", description: "Fine marked as paid." });
    },
  });

  const deleteFineMutation = useMutation({
    mutationFn: async (fineId: string) => apiRequest("DELETE", `/api/admin/fines/${fineId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      toast({ title: "Deleted", description: "Fine removed successfully." });
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
      toast({ title: "Updated", description: "Fine details updated." });
      setEditingFine(null);
    },
  });

  // Fetch categories for edit modal
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: !!editingFine,
  });

  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories"],
    enabled: !!editingFine,
  });

  // Share Logic
  const handleShare = async () => {
    if (!team) return;
    const shareUrl = `${window.location.origin}/join/${team.inviteCode}`;
    const shareData = {
      title: `Join ${team.name} on FoulPay`,
      text: `Use code ${team.inviteCode} to join my team on FoulPay!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "Link Copied", 
          description: "Invite link copied to your clipboard.",
          duration: 3000
        });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Could not copy link." });
      }
    }
  };

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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* 1. TEAM HEADER (Stretched Full Width) */}
        <div className="w-full flex items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col pl-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">Team Code</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{team?.inviteCode || "..."}</span>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all active:scale-95"
            onClick={handleShare}
            aria-label="Share team invite"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* 2. STATS ROW */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard 
            label="In Pot"
            value={fundsSummaryLoading ? "-" : formatCurrency(fundsSummary?.inPot || 0)}
            icon={Wallet}
            color="emerald"
          />
          <StatCard 
            label="Outstanding"
            value={statsLoading ? "-" : formatCurrency(parseFloat(stats?.outstandingFines || "0"))}
            icon={AlertCircle}
            color="amber"
          />
          <StatCard 
            label="Squad"
            value={stats?.totalPlayers || 0}
            icon={Users}
            color="blue"
          />
        </div>

        {/* 3. FINES LIST SECTION */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Fines</h3>
              </div>
              
              {/* Button updated to Blue */}
              <Button 
                size="sm" 
                onClick={() => setLocation("/admin/fines")}
                className="h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold uppercase tracking-wide px-4 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                New Fine
              </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search player or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-2xl bg-white border-0 shadow-lg shadow-slate-200/50 focus-visible:ring-2 focus-visible:ring-blue-500 text-sm font-medium"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white shadow-lg shadow-slate-200/50 shrink-0 text-slate-400">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              <FilterPill 
                label="All" 
                active={statusFilter === 'all'} 
                onClick={() => setStatusFilter('all')} 
              />
              <FilterPill 
                label="Unpaid" 
                active={statusFilter === 'unpaid'} 
                onClick={() => setStatusFilter('unpaid')} 
              />
              <FilterPill 
                label="Paid" 
                active={statusFilter === 'paid'} 
                onClick={() => setStatusFilter('paid')} 
              />
              <div className="w-px h-5 bg-slate-200 mx-1 self-center" />
              <FilterPill 
                label="This Month" 
                active={dateFilter === 'month'} 
                onClick={() => setDateFilter(dateFilter === 'month' ? 'all' : 'month')} 
              />
            </div>
          </div>

          {/* Fines List */}
          <div className="space-y-3 pb-20">
            {finesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white rounded-2xl shadow-lg shadow-slate-200/50 animate-pulse" />
                ))}
              </div>
            ) : filteredFines.length > 0 ? (
              filteredFines.map((fine) => (
                <FineListItem 
                  key={fine.id} 
                  fine={fine} 
                  isExpanded={expandedFineId === fine.id}
                  onToggle={() => setExpandedFineId(expandedFineId === fine.id ? null : fine.id)}
                  onPay={() => markAsPaidMutation.mutate(fine)}
                  onDelete={() => deleteFineMutation.mutate(fine.id)}
                  onEdit={() => setEditingFine(fine)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold text-sm">No fines found</p>
                <Button 
                  variant="link" 
                  className="text-blue-600 text-xs mt-1 h-auto p-0 font-medium"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
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

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, color }: any) {
  const gradients = {
    emerald: "from-emerald-400 to-emerald-600",
    amber: "from-amber-400 to-orange-500",
    blue: "from-blue-400 to-indigo-600",
  };

  return (
    <div className="flex flex-col p-3 rounded-2xl bg-white shadow-lg shadow-slate-200/50 border-0 h-28 relative overflow-hidden">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[color as keyof typeof gradients]} flex items-center justify-center mb-auto shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="mt-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-slate-900 tracking-tighter leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap",
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
          : "bg-white text-slate-400 hover:text-slate-600 shadow-sm shadow-slate-200/50"
      )}
    >
      {label}
    </button>
  );
}

function FineListItem({ 
  fine, 
  isExpanded, 
  onToggle, 
  onPay, 
  onDelete, 
  onEdit 
}: { 
  fine: FineWithDetails, 
  isExpanded: boolean, 
  onToggle: () => void,
  onPay: () => void,
  onDelete: () => void,
  onEdit: () => void
}) {
  const fullName = `${fine.player?.firstName || ''} ${fine.player?.lastName || ''}`.trim();
  const displayName = fine.player?.nickname || fullName;
  const initials = `${fine.player?.firstName?.[0] || ''}${fine.player?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div 
      className={cn(
        "group relative bg-white rounded-2xl transition-all duration-300 overflow-hidden",
        isExpanded 
          ? "shadow-xl shadow-blue-900/5 ring-1 ring-blue-50 z-10 scale-[1.02]" 
          : "shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/40 border-0"
      )}
    >
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <Avatar className={cn("w-10 h-10 rounded-full", fine.isPaid ? "ring-2 ring-emerald-100" : "ring-2 ring-slate-100")}>
              {fine.player?.profileImageUrl && (
                <AvatarImage src={fine.player.profileImageUrl} alt={displayName} className="rounded-full object-cover" />
              )}
              <AvatarFallback className={cn(
                "rounded-full text-xs font-black", 
                fine.isPaid ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600" : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                {fine.subcategory?.name || "Fine"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className={cn("text-sm font-black tracking-tight", fine.isPaid ? "text-emerald-600" : "text-slate-900")}>
              {formatCurrency(parseFloat(fine.amount))}
            </p>
            <div className="flex justify-end mt-1.5">
               <div className={cn("w-1.5 h-1.5 rounded-full", fine.isPaid ? "bg-emerald-500" : "bg-orange-500")} />
            </div>
          </div>
        </div>

        {fine.description && (
          <p className="text-xs font-medium text-slate-400 mt-3 pl-[54px] truncate">
            {fine.description}
          </p>
        )}
      </div>

      {isExpanded && !fine.isPaid && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
          <div className="h-px w-full bg-slate-50 mb-4" />
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl h-10 shadow-lg shadow-emerald-200 text-xs font-bold uppercase tracking-wide"
              onClick={(e) => { e.stopPropagation(); onPay(); }}
            >
              <Check className="w-3.5 h-3.5 mr-2" />
              Mark Paid
            </Button>
            <Button 
              variant="outline"
              className="px-3 rounded-xl border-slate-100 h-10 bg-white shadow-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit className="w-4 h-4 text-slate-400" />
            </Button>
            <Button 
              variant="outline"
              className="px-3 rounded-xl border-red-50 bg-red-50/50 text-red-500 hover:bg-red-50 hover:text-red-600 h-10 shadow-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider text-center mt-3">
            Issued {formatDate(fine.createdAt)}
          </p>
        </div>
      )}
      
      {isExpanded && fine.isPaid && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
          <div className="h-px w-full bg-slate-50 mb-4" />
           <div className="flex gap-2">
            <Button 
              variant="ghost"
              className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs h-9 font-bold"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Record
            </Button>
           </div>
        </div>
      )}
    </div>
  );
}

// Edit Fine Modal
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

  const filteredSubcategories = useMemo(() => {
    if (!selectedCategoryId) return subcategories;
    return subcategories.filter(sub => sub.categoryId === selectedCategoryId);
  }, [selectedCategoryId, subcategories]);

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
      <DialogContent className="w-[95vw] max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Edit Fine</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-slate-400 tracking-wider">Amount (£)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="h-14 rounded-2xl text-xl font-black border-slate-100 bg-slate-50/50 focus-visible:ring-blue-500 focus-visible:bg-white transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel className="text-xs uppercase font-bold text-slate-400 tracking-wider">Category</FormLabel>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    form.setValue("subcategoryId", "");
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl mt-1.5 border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-slate-400 tracking-wider">Subcategory</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-slate-400 tracking-wider">Notes</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-medium"
                      placeholder="Optional details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border-slate-100 text-slate-500 font-bold uppercase tracking-wide hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wide shadow-lg shadow-blue-200"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
