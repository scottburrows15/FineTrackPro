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
  CreditCard
} from "lucide-react";

export default function AdminDashboard() {
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
  const [selectedFineForPayment, setSelectedFineForPayment] = useState<FineWithDetails | undefined>(undefined);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'fines' | 'analytics' | 'team' | 'settings'>('overview');
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);

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
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {teamInfo ? `Managing ${teamInfo.name}` : 'Manage your team and fines'}
          </p>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Actions</h2>
            
            {/* Horizontal Carousel */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-3 pb-2" style={{ minWidth: 'max-content' }}>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200 min-w-[100px] flex-shrink-0"
                    onClick={() => setShowIssueFineModal(true)}
                  >
                    <Gavel className="w-6 h-6 text-red-600" />
                    <span className="text-xs font-medium text-center">Issue Fine</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 min-w-[100px] flex-shrink-0"
                    onClick={() => setShowAddPlayerModal(true)}
                  >
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-medium text-center">Add Player</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200 min-w-[100px] flex-shrink-0"
                    onClick={() => setShowAnalyticsModal(true)}
                  >
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                    <span className="text-xs font-medium text-center">Analytics</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 min-w-[100px] flex-shrink-0"
                    onClick={() => setShowManageCategoriesModal(true)}
                    data-action="manage-categories"
                  >
                    <Tags className="w-6 h-6 text-purple-600" />
                    <span className="text-xs font-medium text-center">Fine Types</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200 min-w-[100px] flex-shrink-0"
                    onClick={() => setShowManageTeamModal(true)}
                  >
                    <Settings className="w-6 h-6 text-green-600" />
                    <span className="text-xs font-medium text-center">Team Settings</span>
                  </Button>
                </div>
              </div>
              
              {/* Scroll indicators for mobile */}
              <div className="absolute top-2 right-2 text-xs text-slate-400 md:hidden">
                Scroll →
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Invitation */}
        <AdminShareLink />

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Players</p>
                  <p className="text-xl font-bold text-slate-900">
                    {statsLoading ? '-' : stats?.totalPlayers || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Outstanding</p>
                  <p className="text-xl font-bold text-slate-900">
                    {statsLoading ? '-' : formatCurrency(parseFloat(stats?.outstandingFines || '0'))}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Fines</p>
                  <p className="text-xl font-bold text-slate-900">
                    {finesLoading ? '-' : fines.length}
                  </p>
                </div>
                <Gavel className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Monthly</p>
                  <p className="text-xl font-bold text-slate-900">
                    {statsLoading ? '-' : formatCurrency(parseFloat(stats?.monthlyCollection || '0'))}
                  </p>
                </div>
                <PoundSterling className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unpaid Fines Section */}
        <div id="unpaid-fines-section">
          <Card>
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Unpaid Fines ({unpaidFines.length})
              </h3>
            </div>
            <CardContent className="p-4">
              {unpaidLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : unpaidFines.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">All Caught Up!</h3>
                  <p className="text-slate-600">No unpaid fines at the moment.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {unpaidFines.map((fine) => {
                    const isExpanded = expandedFineId === fine.id;
                    return (
                      <div key={fine.id} className="bg-red-50 border border-red-200 rounded-md overflow-hidden">
                        {/* Compact row - clickable to expand */}
                        <div 
                          className="p-3 cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => setExpandedFineId(isExpanded ? null : fine.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Player info and fine details */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-slate-600">
                                  {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {fine.player.firstName} {fine.player.lastName}
                                </div>
                                <div className="text-xs text-slate-600">{fine.subcategory.name}</div>
                              </div>
                            </div>
                            
                            {/* Center: Amount and status */}
                            <div className="text-center flex-shrink-0">
                              <div className="font-semibold text-slate-900 text-sm">
                                {formatCurrency(parseFloat(fine.amount))}
                              </div>
                              <Badge variant="destructive" className="text-xs px-2 py-1">
                                Unpaid
                              </Badge>
                            </div>
                            
                            {/* Right: Quick action buttons + expand indicator */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFineForPayment(fine);
                                  setShowManualPaymentModal(true);
                                }}
                                className="text-green-600 hover:bg-green-50 px-3 py-2"
                                title="Record Payment"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFine.mutate(fine.id);
                                }}
                                disabled={deleteFine.isPending}
                                className="px-3 py-2"
                                title="Delete Fine"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <div className="text-slate-400 ml-2 text-sm">
                                {isExpanded ? '▼' : '▶'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded details - fine-specific information only */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-red-200 bg-red-25">
                            <div className="pt-3 space-y-3">
                              {/* Fine category and subcategory */}
                              <div>
                                <span className="font-medium text-slate-600 text-sm">Fine Type:</span>
                                <div className="text-sm text-slate-900 mt-1">{fine.subcategory.name}</div>
                                {fine.subcategory.category && (
                                  <div className="text-xs text-slate-500">Category: {fine.subcategory.category.name}</div>
                                )}
                              </div>
                              
                              {/* Full description */}
                              {fine.description && (
                                <div>
                                  <span className="font-medium text-slate-600 text-sm">Description:</span>
                                  <div className="text-sm text-slate-900 mt-1 leading-relaxed">{fine.description}</div>
                                </div>
                              )}
                              
                              {/* Issue details */}
                              <div className="border-t border-red-200 pt-3">
                                <div className="text-sm text-red-600">
                                  Issued on {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-GB', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  }) : 'Unknown date'}
                                </div>
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
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-slate-600">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </span>
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

        {/* Recent Activity */}
        <Card>
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <CardContent className="p-4">
            {finesLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-slate-600 mt-2">Loading...</p>
              </div>
            ) : fines.length === 0 ? (
              <div className="text-center py-6">
                <Gavel className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No fines issued yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {fines.slice(0, 10).map((fine) => (
                  <div key={fine.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-slate-600">
                          {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {fine.player.firstName} {fine.player.lastName}
                        </p>
                        <p className="text-sm text-slate-600 truncate">{fine.subcategory.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-slate-900">{formatCurrency(parseFloat(fine.amount))}</p>
                      <Badge variant={fine.isPaid ? 'default' : 'secondary'} className="text-xs">
                        {fine.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                ))}
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
      </div>
    </div>
  );
}