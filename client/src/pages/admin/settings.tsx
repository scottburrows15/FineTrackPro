import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AdminPreferences } from "@shared/schema";
import { 
  Users, 
  FileText, 
  Crown,
  Shield,
  DollarSign,
  Calendar,
  Edit,
  LogOut,
  Bell,
  Mail,
  Smartphone,
  HelpCircle,
  ChevronRight
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

  // Admin notification preferences
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [summaryNotificationsEnabled, setSummaryNotificationsEnabled] = useState(false);

  // Fetch admin preferences
  const { data: preferences } = useQuery<AdminPreferences>({
    queryKey: ["/api/admin/preferences"],
    enabled: !!user && user.role === 'admin',
  });

  // Load preferences when fetched
  useEffect(() => {
    if (preferences) {
      setEmailAlertsEnabled(preferences.emailAlertsEnabled);
      setPushNotificationsEnabled(preferences.pushNotificationsEnabled);
      setSummaryNotificationsEnabled(preferences.summaryNotificationsEnabled);
    }
  }, [preferences]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: { emailAlertsEnabled: boolean; pushNotificationsEnabled: boolean; summaryNotificationsEnabled: boolean }) => {
      return apiRequest("POST", "/api/admin/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/preferences"] });
    },
  });

  // Helper functions to update preferences
  const updateEmailAlerts = (value: boolean) => {
    setEmailAlertsEnabled(value);
    savePreferencesMutation.mutate({
      emailAlertsEnabled: value,
      pushNotificationsEnabled,
      summaryNotificationsEnabled,
    });
  };

  const updatePushNotifications = (value: boolean) => {
    setPushNotificationsEnabled(value);
    savePreferencesMutation.mutate({
      emailAlertsEnabled,
      pushNotificationsEnabled: value,
      summaryNotificationsEnabled,
    });
  };

  const updateSummaryNotifications = (value: boolean) => {
    setSummaryNotificationsEnabled(value);
    savePreferencesMutation.mutate({
      emailAlertsEnabled,
      pushNotificationsEnabled,
      summaryNotificationsEnabled: value,
    });
  };

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
      pageTitle="Team Settings"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 overflow-x-hidden">
        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Team Information */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Team Information</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage team details</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Team Name</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100" data-testid="text-team-name">{teamInfo?.name || 'Loading...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sport</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100" data-testid="text-team-sport">{teamInfo?.sport || 'Loading...'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowManageTeamModal(true)}
                  data-testid="button-edit-team"
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPlayerModal(true)}
                  data-testid="button-add-player"
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Players
                </Button>
              </div>
            </Card>

            {/* Fine Categories */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Fine Categories</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage categories and subcategories</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full justify-between h-12"
                onClick={() => setShowManageCategoriesModal(true)}
                data-testid="button-manage-categories"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span>Manage Categories</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>

            {/* Audit History */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Audit History</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">View all team actions</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full justify-between h-12"
                onClick={() => setShowAuditTrailModal(true)}
                data-testid="button-audit-history"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4" />
                  <span>View Audit Trail</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Admin Notifications */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Admin Notifications</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage alert settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="email-alerts" className="font-medium text-sm">Email Alerts</Label>
                      <p className="text-xs text-slate-500">Fines settled notifications</p>
                    </div>
                  </div>
                  <Switch
                    id="email-alerts"
                    checked={emailAlertsEnabled}
                    onCheckedChange={updateEmailAlerts}
                    data-testid="switch-email-alerts"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium text-sm">Push Notifications</Label>
                      <p className="text-xs text-slate-500">Instant fine alerts</p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotificationsEnabled}
                    onCheckedChange={updatePushNotifications}
                    data-testid="switch-push-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="summary-notifications" className="font-medium text-sm">Summary Notifications</Label>
                      <p className="text-xs text-slate-500">Activity digests</p>
                    </div>
                  </div>
                  <Switch
                    id="summary-notifications"
                    checked={summaryNotificationsEnabled}
                    onCheckedChange={updateSummaryNotifications}
                    data-testid="switch-summary-notifications"
                  />
                </div>
              </div>
            </Card>

            {/* Subscription */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Subscription</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your plan</p>
                </div>
                {teamInfo?.isTrialActive && (
                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                    Trial
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full justify-between h-12"
                onClick={() => setShowSubscriptionModal(true)}
                data-testid="button-manage-subscription"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4" />
                  <span>Manage Subscription</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>

            {/* Support & Actions */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/help")}
                  data-testid="link-help"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            FoulPay v1.0.0
          </p>
        </div>
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
