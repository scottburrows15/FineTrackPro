import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IssueFineModal from "./issue-fine-modal";
import AdminShareLink from "./admin-share-link";
import AddPlayerModal from "./add-player-modal";
import ManageCategoriesModal from "./manage-categories-modal";
import ManageTeamModal from "./manage-team-modal";
import ProfileModal from "./profile-modal";
import AnalyticsDashboard from "./analytics-dashboard";
import ManualPaymentModal from "./manual-payment-modal";
import EditPlayerModal from "./edit-player-modal";
import AuditTrailModal from "./audit-trail-modal";
import BulkFineModal from "./bulk-fine-modal";
import SubscriptionManagementModal from "./subscription-management-modal";
import UnifiedFineIssuer from "./unified-fine-issuer";
import FineFilters from "./fine-filters";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FineWithDetails, TeamStats, Team, User } from "@shared/schema";
import { 
  Plus, 
  UserPlus, 
  Users, 
  Gavel, 
  TrendingUp, 
  AlertTriangle,
  Tags,
  Settings,
  Edit,
  Check,
  Trash2,
  Copy,
  Share,
  CheckCircle,
  Crown,
  Calendar,
  PoundSterling,
  CreditCard,
  Activity,
  FileText,
  Search
} from "lucide-react";

interface AdminDashboardProps {
  activeSection?: string;
}

export default function AdminDashboard({ activeSection = 'home' }: AdminDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showIssueFineModal, setShowIssueFineModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [showBulkFineModal, setShowBulkFineModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUnifiedFineIssuer, setShowUnifiedFineIssuer] = useState(false);
  const [selectedFineForPayment, setSelectedFineForPayment] = useState<FineWithDetails | undefined>(undefined);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<User | null>(null);
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);
  const [filteredFines, setFilteredFines] = useState<FineWithDetails[]>([]);

  // Handle activeSection navigation from bottom nav
  if (activeSection === 'issue-fines') {
    if (!showUnifiedFineIssuer) {
      setTimeout(() => setShowUnifiedFineIssuer(true), 100);
    }
  } else if (activeSection === 'analytics') {
    if (!showAnalyticsModal) {
      setTimeout(() => setShowAnalyticsModal(true), 100);
    }
  } else if (activeSection === 'team-settings') {
    if (!showManageTeamModal) {
      setTimeout(() => setShowManageTeamModal(true), 100);
    }
  }

  const { data: stats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ["/api/stats/team"],
  });

  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/team"],
  });

  const { data: teamInfo, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/team/info"],
  });

  const { data: unpaidFines = [], isLoading: unpaidLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/admin/unpaid-fines"],
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
  });

  const deleteFine = useMutation({
    mutationFn: async (fineId: string) => {
      return await apiRequest("DELETE", `/api/admin/fines/${fineId}`);
    },
    onSuccess: () => {
      toast({
        title: "Fine Deleted",
        description: "The fine has been successfully deleted.",
      });
      // Comprehensive cache invalidation to ensure dashboard totals update
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/player"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete fine",
        variant: "destructive",
      });
    },
  });

  const handleRecordPayment = (fine: FineWithDetails) => {
    setSelectedFineForPayment(fine);
    setShowManualPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowManualPaymentModal(false);
    setSelectedFineForPayment(undefined);
  };







  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Team Invitation */}
        <AdminShareLink />

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Players</p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    {statsLoading ? '-' : stats?.totalPlayers || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500 drop-shadow-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/30 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Outstanding</p>
                  <p className="text-xl font-bold text-red-800 dark:text-red-200">
                    {statsLoading ? '-' : formatCurrency(parseFloat(stats?.outstandingFines || '0'))}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500 drop-shadow-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Total Fines</p>
                  <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                    {finesLoading ? '-' : fines.length}
                  </p>
                </div>
                <Gavel className="w-8 h-8 text-purple-500 drop-shadow-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Monthly</p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">
                    {statsLoading ? '-' : formatCurrency(parseFloat(stats?.monthlyCollection || '0'))}
                  </p>
                </div>
                <PoundSterling className="w-8 h-8 text-emerald-500 drop-shadow-sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unpaid Fines Section */}
        <div id="unpaid-fines-section">
          <Card>
            <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                Unpaid Fines ({unpaidFines.length})
              </h3>
            </div>
            <CardContent className="p-4">
              {unpaidLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gradient-to-r from-slate-200 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : unpaidFines.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 drop-shadow-sm" />
                  <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No unpaid fines at the moment.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {unpaidFines.map((fine) => {
                    const isExpanded = expandedFineId === fine.id;
                    return (
                      <div key={fine.id} className="bg-red-50 border border-red-200 rounded-md overflow-hidden">
                        {/* Compact row - clickable to expand */}
                        <div 
                          className="p-2.5 cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => setExpandedFineId(isExpanded ? null : fine.id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            {/* Player info row */}
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {fine.player.profileImageUrl ? (
                                  <img 
                                    src={fine.player.profileImageUrl} 
                                    alt={`${fine.player.firstName} ${fine.player.lastName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<span class="text-xs font-medium text-slate-600">${fine.player.firstName?.[0] || ''}${fine.player.lastName?.[0] || ''}</span>`;
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-slate-600">
                                    {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {fine.player.firstName} {fine.player.lastName}
                                </div>
                                <div className="text-xs text-slate-600">{fine.subcategory.name}</div>
                              </div>
                            </div>
                            
                            {/* Amount and status - vertically aligned */}
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <div className="text-center sm:text-right">
                                <div className="font-semibold text-slate-900 text-sm">
                                  {formatCurrency(parseFloat(fine.amount))}
                                </div>
                                <Badge variant="destructive" className="text-xs">
                                  Unpaid
                                </Badge>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFineForPayment(fine);
                                    setShowManualPaymentModal(true);
                                  }}
                                  className="text-green-600 hover:bg-green-50 px-2 py-1 h-8"
                                  title="Record Payment"
                                >
                                  <CreditCard className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFine.mutate(fine.id);
                                  }}
                                  disabled={deleteFine.isPending}
                                  className="px-2 py-1 h-8"
                                  title="Delete Fine"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                <div className="text-slate-400 ml-1 text-sm">
                                  {isExpanded ? '▼' : '▶'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded details - fine-specific information only */}
                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 border-t border-red-200 bg-red-25">
                            <div className="pt-2 space-y-2">
                              {/* Full description */}
                              {fine.description && (
                                <div>
                                  <span className="font-medium text-slate-600 text-xs">Description:</span>
                                  <div className="text-xs text-slate-900 mt-1 leading-relaxed">{fine.description}</div>
                                </div>
                              )}
                              
                              {/* Issue details */}
                              <div className="text-xs text-red-600">
                                Issued on {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-GB', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : 'Unknown date'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Management Section */}
        <div id="team-management-section">
          <Card>
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Team Members ({teamMembers.length})
              </h3>
            </div>
            <CardContent className="p-4">
              {membersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Team Members</h3>
                  <p className="text-slate-600">Add team members to get started.</p>
                  <Button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="mt-4"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {member.profileImageUrl ? (
                            <img 
                              src={member.profileImageUrl} 
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-sm font-medium text-slate-600">${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-600">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-slate-600 truncate">{member.email}</div>
                          {member.position && (
                            <div className="text-xs text-slate-500">{member.position}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {member.role === 'admin' ? 'Admin' : 'Player'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlayerForEdit(member);
                            setShowEditPlayerModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Team Fines with Enhanced Filtering */}
        <Card>
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              All Team Fines ({filteredFines.length || 0} / {fines.length || 0})
            </h3>
          </div>

          {/* Enhanced Fine Filters */}
          {fines && fines.length > 0 && (
            <div className="px-4 pt-4">
              <FineFilters 
                fines={fines} 
                onFilteredFinesChange={setFilteredFines} 
              />
            </div>
          )}

          <CardContent className="p-4">
            {finesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : fines.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Fines Yet</h3>
                <p className="text-slate-600 mb-4">No fines have been issued to the team yet.</p>
              </div>
            ) : filteredFines.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Matching Fines</h3>
                <p className="text-slate-600">No fines match your current filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {filteredFines.map((fine) => {
                  const isExpanded = expandedFineId === fine.id;
                  return (
                    <div key={fine.id} className={`border rounded-md overflow-hidden ${
                      fine.isPaid ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {/* Compact row - clickable to expand */}
                      <div 
                        className={`p-2.5 cursor-pointer transition-colors ${
                          fine.isPaid ? 'hover:bg-green-100' : 'hover:bg-slate-100'
                        }`}
                        onClick={() => setExpandedFineId(isExpanded ? null : fine.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          {/* Player info row */}
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {fine.player.profileImageUrl ? (
                                <img 
                                  src={fine.player.profileImageUrl} 
                                  alt={`${fine.player.firstName} ${fine.player.lastName}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs font-medium text-slate-600">${fine.player.firstName?.[0] || ''}${fine.player.lastName?.[0] || ''}</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-medium text-slate-600">
                                  {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900">
                                {fine.player.firstName} {fine.player.lastName}
                              </div>
                              <div className="text-xs text-slate-600">{fine.subcategory.name}</div>
                            </div>
                          </div>
                          
                          {/* Amount and status - vertically aligned */}
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <div className="text-center sm:text-right">
                              <div className="font-semibold text-slate-900 text-sm">
                                {formatCurrency(parseFloat(fine.amount))}
                              </div>
                              <Badge variant={fine.isPaid ? "default" : "destructive"} className={`text-xs ${fine.isPaid ? 'bg-green-100 text-green-800' : ''}`}>
                                {fine.isPaid ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {!fine.isPaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFineForPayment(fine);
                                    setShowManualPaymentModal(true);
                                  }}
                                  className="text-green-600 hover:bg-green-50 px-2 py-1 h-8"
                                  title="Record Payment"
                                >
                                  <CreditCard className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFine.mutate(fine.id);
                                }}
                                disabled={deleteFine.isPending}
                                className="px-2 py-1 h-8"
                                title="Delete Fine"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <div className="text-slate-400 ml-1 text-sm">
                                {isExpanded ? '▼' : '▶'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded details */}
                      {isExpanded && (
                        <div className={`px-2.5 pb-2.5 border-t ${
                          fine.isPaid ? 'border-green-200 bg-green-25' : 'border-slate-200 bg-slate-25'
                        }`}>
                          <div className="pt-2 space-y-2">
                            {/* Full description */}
                            {fine.description && (
                              <div>
                                <span className="font-medium text-slate-600 text-xs">Description:</span>
                                <div className="text-xs text-slate-900 mt-1 leading-relaxed">{fine.description}</div>
                              </div>
                            )}
                            
                            {/* Issue details */}
                            <div className="text-xs text-slate-600">
                              Issued on {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-GB', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'Unknown date'}
                              {fine.isPaid && fine.paidAt && (
                                <span className="block text-green-600">
                                  Paid on {new Date(fine.paidAt).toLocaleDateString('en-GB', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                  {fine.paymentMethod && ` via ${fine.paymentMethod.charAt(0).toUpperCase() + fine.paymentMethod.slice(1)}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {showIssueFineModal && (
          <IssueFineModal 
            isOpen={showIssueFineModal} 
            onClose={() => setShowIssueFineModal(false)} 
          />
        )}
        
        {showAddPlayerModal && (
          <AddPlayerModal 
            isOpen={showAddPlayerModal} 
            onClose={() => setShowAddPlayerModal(false)} 
          />
        )}
        
        {showManageCategoriesModal && (
          <ManageCategoriesModal 
            isOpen={showManageCategoriesModal} 
            onClose={() => setShowManageCategoriesModal(false)} 
          />
        )}
        
        {showManageTeamModal && (
          <ManageTeamModal 
            isOpen={showManageTeamModal} 
            onClose={() => setShowManageTeamModal(false)} 
          />
        )}
        
        {showAnalyticsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
                <Button variant="outline" size="sm" onClick={() => setShowAnalyticsModal(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                <AnalyticsDashboard />
              </div>
            </div>
          </div>
        )}
        
        {showProfileModal && (
          <ProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)} 
          />
        )}
        
        {showManualPaymentModal && selectedFineForPayment && (
          <ManualPaymentModal 
            isOpen={showManualPaymentModal} 
            onClose={handleClosePaymentModal}
            fine={selectedFineForPayment}
          />
        )}

        {showEditPlayerModal && selectedPlayerForEdit && (
          <EditPlayerModal 
            isOpen={showEditPlayerModal} 
            onClose={() => {
              setShowEditPlayerModal(false);
              setSelectedPlayerForEdit(null);
            }}
            player={selectedPlayerForEdit}
          />
        )}

        {showAuditTrailModal && (
          <AuditTrailModal 
            isOpen={showAuditTrailModal} 
            onClose={() => setShowAuditTrailModal(false)} 
          />
        )}

        {showBulkFineModal && (
          <BulkFineModal 
            isOpen={showBulkFineModal} 
            onClose={() => setShowBulkFineModal(false)} 
          />
        )}

        {showSubscriptionModal && (
          <SubscriptionManagementModal 
            isOpen={showSubscriptionModal} 
            onClose={() => setShowSubscriptionModal(false)} 
          />
        )}

        <UnifiedFineIssuer
          isOpen={showUnifiedFineIssuer}
          onClose={() => setShowUnifiedFineIssuer(false)}
        />
      </div>
    </div>
  );
}