import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { 
  Settings as SettingsIcon, 
  Users, 
  FileText, 
  Crown,
  Shield,
  DollarSign,
  Calendar,
  Edit,
  LogOut
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import ManageTeamModal from "@/components/manage-team-modal";
import ManageCategoriesModal from "@/components/manage-categories-modal";
import AddPlayerModal from "@/components/add-player-modal";
import AuditTrailModal from "@/components/audit-trail-modal";
import SubscriptionManagementModal from "@/components/subscription-management-modal";
import type { Team, Notification } from "@shared/schema";

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    window.location.href = "/api/logout";
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Settings"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">Team Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your team, categories, and subscription
          </p>
        </div>

        {/* Team Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Team Information</h3>
              <p className="text-sm text-muted-foreground">Manage team details and settings</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Team Name</p>
              <p className="font-medium" data-testid="text-team-name">{teamInfo?.name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sport</p>
              <p className="font-medium" data-testid="text-team-sport">{teamInfo?.sport || 'Loading...'}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowManageTeamModal(true)}
                data-testid="button-edit-team"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddPlayerModal(true)}
                data-testid="button-add-player"
              >
                <Users className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </div>
          </div>
        </Card>

        {/* Fine Categories */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Fine Categories</h3>
              <p className="text-sm text-muted-foreground">Manage fine categories and subcategories</p>
            </div>
          </div>
          <Separator className="my-4" />
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowManageCategoriesModal(true)}
            data-testid="button-manage-categories"
          >
            <FileText className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
        </Card>

        {/* Audit History */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Audit History</h3>
              <p className="text-sm text-muted-foreground">View all team actions and changes</p>
            </div>
          </div>
          <Separator className="my-4" />
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowAuditTrailModal(true)}
            data-testid="button-audit-history"
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Audit Trail
          </Button>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Subscription</h3>
              <p className="text-sm text-muted-foreground">Manage your subscription plan</p>
            </div>
            {teamInfo?.isTrialActive && (
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                Trial
              </Badge>
            )}
          </div>
          <Separator className="my-4" />
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowSubscriptionModal(true)}
            data-testid="button-manage-subscription"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Manage Subscription
          </Button>
        </Card>

        {/* Account Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Account</h3>
              <p className="text-sm text-muted-foreground">Account and security settings</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/profile")}
              data-testid="button-edit-profile"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </Card>

        {/* Help */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-muted-foreground text-center">
            Need help? Visit our{" "}
            <button
              onClick={() => setLocation("/help")}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              data-testid="link-help"
            >
              Help Center
            </button>
          </p>
        </Card>
      </div>

      {/* Modals */}
      <ManageTeamModal 
        isOpen={showManageTeamModal} 
        onClose={() => setShowManageTeamModal(false)} 
      />
      <ManageCategoriesModal 
        isOpen={showManageCategoriesModal} 
        onClose={() => setShowManageCategoriesModal(false)} 
      />
      <AddPlayerModal 
        isOpen={showAddPlayerModal} 
        onClose={() => setShowAddPlayerModal(false)} 
      />
      <AuditTrailModal 
        isOpen={showAuditTrailModal} 
        onClose={() => setShowAuditTrailModal(false)} 
      />
      <SubscriptionManagementModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </AppLayout>
  );
}
