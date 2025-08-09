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
  DollarSign,
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
  const [selectedFineForPayment, setSelectedFineForPayment] = useState<FineWithDetails | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<'overview' | 'fines' | 'analytics' | 'team' | 'settings'>('overview');

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
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">
              {teamInfo ? `Managing ${teamInfo.name}` : 'Manage your team and fines'}
            </p>
          </div>
          {teamInfo && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Team Code</p>
              <p className="font-mono text-lg font-semibold text-primary">{teamInfo.inviteCode}</p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button 
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200"
                onClick={() => setShowIssueFineModal(true)}
              >
                <Gavel className="w-5 h-5 text-red-600" />
                <span className="text-xs sm:text-sm font-medium">Issue Fine</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => setShowAddPlayerModal(true)}
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">Add Player</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200"
                onClick={() => setShowAnalyticsModal(true)}
              >
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-xs sm:text-sm font-medium">Analytics</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={() => setShowManageCategoriesModal(true)}
              >
                <Tags className="w-5 h-5 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium">Fine Types</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200"
                onClick={() => setShowManageTeamModal(true)}
              >
                <Settings className="w-5 h-5 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Invitation */}
        <AdminShareLink />

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
              <div className="space-y-3">
                {fines.slice(0, 5).map((fine) => (
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
      </div>
    </div>
  );
}