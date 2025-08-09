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



  // Overview Section
  const OverviewSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Team Overview</h2>
      
      {/* Team Invitation Section */}
      <AdminShareLink />

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Players</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '-' : stats?.totalPlayers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Outstanding Fines</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '-' : formatCurrency(parseFloat(stats?.outstandingFines || '0'))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Gavel className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Fines</p>
                <p className="text-2xl font-bold text-slate-900">
                  {finesLoading ? '-' : fines.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recent Fines</h3>
        </div>
        <CardContent className="p-6">
          {finesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-600 mt-2">Loading fines...</p>
            </div>
          ) : fines.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No fines issued yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fines.slice(0, 5).map((fine) => (
                <div key={fine.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">
                        {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {fine.player.firstName} {fine.player.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{fine.subcategory.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(parseFloat(fine.amount))}</p>
                    <Badge variant={fine.isPaid ? 'default' : 'secondary'}>
                      {fine.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Fines Management Section
  const FinesSection = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>

      {/* Unpaid Fines */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Unpaid Fines</h3>
        </div>
        <CardContent className="p-6">
          {unpaidLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : unpaidFines.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600">All fines have been paid!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unpaidFines.map((fine) => (
                <div key={fine.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-700">
                        {fine.player.firstName?.[0]}{fine.player.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {fine.player.firstName} {fine.player.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{fine.subcategory.name}</p>
                      <p className="text-xs text-slate-500">
                        Issued {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="font-semibold text-slate-900">{formatCurrency(parseFloat(fine.amount))}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecordPayment(fine)}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Record Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFine.mutate(fine.id)}
                      disabled={deleteFine.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Team Management Section
  const TeamSection = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>

      {/* Team Members */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
        </div>
        <CardContent className="p-6">
          {membersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{member.position || 'No position set'}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.role === 'admin' && (
                      <Badge variant="default">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Settings</h2>

      {/* Management Options */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Management</h3>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3 h-auto justify-start"
              onClick={() => setShowManageCategoriesModal(true)}
            >
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Tags className="text-secondary text-sm" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Manage Categories</div>
                <div className="text-xs text-slate-600">Edit fine types and amounts</div>
              </div>
            </Button>

            <Button 
              variant="ghost" 
              className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3 h-auto justify-start"
              onClick={() => setShowManageTeamModal(true)}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="text-primary text-sm" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Team Settings</div>
                <div className="text-xs text-slate-600">Edit team name and sport</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setShowIssueFineModal(true)}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Issue Fine</h3>
              <p className="text-sm text-slate-600">Create new fines for players</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setShowAddPlayerModal(true)}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Add Player</h3>
              <p className="text-sm text-slate-600">Invite new team members</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setShowManageCategoriesModal(true)}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Tags className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Fine Categories</h3>
              <p className="text-sm text-slate-600">Manage fine types and amounts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setShowManageTeamModal(true)}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Team Settings</h3>
              <p className="text-sm text-slate-600">Edit team name and sport</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overview & Stats */}
          <div className="lg:col-span-2 space-y-6">
            <OverviewSection />
            <AnalyticsDashboard />
          </div>

          {/* Right Column - Team & Recent Activity */}
          <div className="space-y-6">
            <TeamSection />
            <FinesSection />
          </div>
        </div>

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