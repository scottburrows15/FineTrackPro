import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FineWithDetails, TeamStats, Notification } from "@shared/schema";
import { 
  Users, 
  AlertTriangle, 
  Megaphone,
  Clock,
  CheckCircle,
  PoundSterling,
  Calendar,
  ChevronDown,
  Search,
  Filter,
  Trash2
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import AdminShareLink from "@/components/admin-share-link";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ["/api/stats/team"],
  });

  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/team"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const unpaidCount = fines.filter(f => !f.isPaid).length;

  // Filter fines based on search, status, category, and date
  const filteredFines = useMemo(() => {
    let result = [...fines];
    
    // Filter by status
    if (statusFilter === "unpaid") {
      result = result.filter(f => !f.isPaid);
    } else if (statusFilter === "paid") {
      result = result.filter(f => f.isPaid);
    }
    
    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter(f => f.subcategory?.category?.id === categoryFilter);
    }
    
    // Filter by date range
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(f => f.createdAt && new Date(f.createdAt) >= today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(f => f.createdAt && new Date(f.createdAt) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(f => f.createdAt && new Date(f.createdAt) >= monthAgo);
    }
    
    // Filter by search query (player name, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => {
        const playerName = `${f.player?.firstName || ''} ${f.player?.lastName || ''}`.toLowerCase();
        const description = (f.description || '').toLowerCase();
        return playerName.includes(query) || description.includes(query);
      });
    }
    
    return result;
  }, [fines, searchQuery, statusFilter, categoryFilter, dateFilter]);

  // Mark fine as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (fine: FineWithDetails) => {
      const payload = {
        paymentMethod: 'manual',
        transactionId: 'Admin Manual Payment',
        notes: 'Marked as paid by admin',
        amount: parseFloat(fine.amount)
      };
      
      const response = await apiRequest('POST', `/api/admin/fines/${fine.id}/record-payment`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fines/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Fine Marked as Paid",
        description: "The fine has been successfully marked as paid.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark fine as paid. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete fine mutation
  const deleteFineMutation = useMutation({
    mutationFn: async (fineId: string) => {
      return apiRequest('DELETE', `/api/admin/fines/${fineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fines/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Fine Deleted",
        description: "The fine has been permanently deleted.",
      });
      setExpandedFineId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete fine. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Admin Dashboard"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Team Invitation Card */}
        <AdminShareLink />

        {/* Announcements */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Team Announcements</h3>
              <p className="text-sm text-muted-foreground">
                Welcome to the admin dashboard! Here you can manage your team's fines, view analytics, and track payments. Use the navigation below to access all features.
              </p>
            </div>
          </div>
        </Card>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Players</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200" data-testid="text-total-players">
                  {statsLoading ? '-' : stats?.totalPlayers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500 drop-shadow-sm" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/30 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Outstanding</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200" data-testid="text-outstanding-amount">
                  {statsLoading ? '-' : formatCurrency(parseFloat(stats?.outstandingFines || '0'))}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500 drop-shadow-sm" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">This Month</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200" data-testid="text-monthly-collection">
                  {statsLoading ? '-' : formatCurrency(parseFloat(stats?.monthlyCollection || '0'))}
                </p>
              </div>
              <PoundSterling className="w-8 h-8 text-emerald-500 drop-shadow-sm" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Unpaid Fines</p>
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200" data-testid="text-unpaid-count">
                  {finesLoading ? '-' : unpaidCount}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500 drop-shadow-sm" />
            </div>
          </Card>
        </div>

        {/* All Fines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">All Fines</h3>
              <p className="text-sm text-muted-foreground">Manage team fines and payments</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/admin/fines")}
              data-testid="button-view-all-fines"
            >
              View All
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by player name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-fines"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-date-filter">
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

          {finesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredFines.length > 0 ? (
            <div className="space-y-3">
              {filteredFines.map((fine) => (
                <Collapsible
                  key={fine.id}
                  open={expandedFineId === fine.id}
                  onOpenChange={(isOpen) => setExpandedFineId(isOpen ? fine.id : null)}
                >
                  <div
                    className={`rounded-lg border ${
                      fine.isPaid
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
                        data-testid={`fine-card-${fine.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <div className={`p-2 rounded-full ${
                            fine.isPaid 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {fine.isPaid ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {fine.player?.firstName} {fine.player?.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span>{fine.subcategory?.name || 'Fine'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(fine.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              fine.isPaid 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(parseFloat(fine.amount))}
                            </p>
                            <Badge 
                              className={`text-xs ${
                                fine.isPaid
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                              }`}
                            >
                              {fine.isPaid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedFineId === fine.id ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t pt-4">
                        <div className="space-y-3">
                          {fine.description && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Description</p>
                              <p className="text-sm">{fine.description}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Issued By</p>
                              <p className="text-sm font-medium">
                                {fine.issuedByUser?.firstName} {fine.issuedByUser?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Date/Time Issued</p>
                              <p className="text-sm font-medium">{formatDate(fine.createdAt)}</p>
                            </div>
                          </div>
                          {fine.paidAt && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Paid On</p>
                              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {formatDate(fine.paidAt)}
                              </p>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {!fine.isPaid && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => markAsPaidMutation.mutate(fine)}
                                disabled={markAsPaidMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                data-testid={`button-mark-paid-${fine.id}`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </Button>
                              <Button
                                onClick={() => deleteFineMutation.mutate(fine.id)}
                                disabled={deleteFineMutation.isPending}
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                data-testid={`button-delete-${fine.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Fine
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : searchQuery || statusFilter !== "all" || categoryFilter !== "all" || dateFilter !== "all" ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No fines match your filters</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No fines yet</p>
              <p className="text-sm">Start issuing fines to see them here</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
