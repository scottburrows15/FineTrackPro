import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AdminPreferences, Team, Notification } from "@shared/schema";
import { 
  Users, FileText, Crown, Shield, Calendar, 
  LogOut, Bell, Mail, Smartphone, HelpCircle, 
  ChevronRight, Settings2, AlertTriangle, Trash2, Loader2,
  Settings, ChevronLeft, Wallet, CreditCard, Building2, Check, ExternalLink, Unlink
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import ManageTeamModal from "@/components/manage-team-modal";
import ManageCategoriesModal from "@/components/manage-categories-modal";
import AuditTrailModal from "@/components/audit-trail-modal";
import SubscriptionManagementModal from "@/components/subscription-management-modal";
import AdminWalletModal from "@/components/admin-wallet-modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GoCardlessStatus {
  connected: boolean;
  organisationId?: string | null;
  connectedAt?: string | null;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [summaryNotifs, setSummaryNotifs] = useState(false);

  // Check for GoCardless callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcStatus = params.get('gocardless');
    if (gcStatus === 'success') {
      toast({
        title: "GoCardless Connected",
        description: "Your team can now receive payments via Open Banking.",
      });
      window.history.replaceState({}, '', '/admin/settings');
    } else if (gcStatus === 'error') {
      const message = params.get('message') || 'Connection failed';
      toast({
        title: "Connection Failed",
        description: message.replace(/\+/g, ' '),
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/admin/settings');
    }
  }, []);

  const { data: preferences } = useQuery<AdminPreferences>({
    queryKey: ["/api/admin/preferences"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
  });

  const { data: gcStatus, isLoading: isGcStatusLoading } = useQuery<GoCardlessStatus>({
    queryKey: ["/api/admin/gocardless/status"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (preferences) {
      setEmailAlerts(preferences.emailAlertsEnabled);
      setPushNotifs(preferences.pushNotificationsEnabled);
      setSummaryNotifs(preferences.summaryNotificationsEnabled);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: any) => apiRequest("POST", "/api/admin/preferences", prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/preferences"] }),
  });

  const connectGcMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/gocardless/connect");
      if (!res.ok) throw new Error('Failed to start connection');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl;
      }
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Could not start GoCardless connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectGcMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/gocardless/disconnect");
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gocardless/status"] });
      toast({
        title: "Disconnected",
        description: "GoCardless has been disconnected from your team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not disconnect GoCardless. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePref = (key: string, val: boolean) => {
    const newPrefs = {
      emailAlertsEnabled: key === 'email' ? val : emailAlerts,
      pushNotificationsEnabled: key === 'push' ? val : pushNotifs,
      summaryNotificationsEnabled: key === 'summary' ? val : summaryNotifs,
    };
    if (key === 'email') setEmailAlerts(val);
    if (key === 'push') setPushNotifs(val);
    if (key === 'summary') setSummaryNotifs(val);
    saveMutation.mutate(newPrefs);
  };

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    // API logic for team deletion
    setTimeout(() => { window.location.href = "/"; }, 2000);
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Team Settings"
      unreadNotifications={unreadCount}
      onViewChange={(v) => setLocation(v === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-32">
        
        {/* --- 1. CORE CONFIGURATION --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Core Configuration</h2>
            {teamInfo?.isTrialActive && (
              <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">Trial Active</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unified Identity Card */}
            <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-800 flex flex-col group active:scale-[0.98] transition-all">
              <button onClick={() => setActiveModal('team')} className="p-5 flex-1 text-left">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
                  Club Identity <ChevronRight className="w-4 h-4 text-slate-300" />
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                  Manage team name, sport, and roster members
                </p>
              </button>
            </Card>

            {/* Fines Card */}
            <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-800 flex flex-col group active:scale-[0.98] transition-all">
              <button onClick={() => setActiveModal('categories')} className="p-5 flex-1 text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-200 dark:shadow-none">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
                  Fine Rules <ChevronRight className="w-4 h-4 text-slate-300" />
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                  Configure categories and set fine amounts
                </p>
              </button>
            </Card>
          </div>
        </section>

        {/* --- 2. PAYMENTS & WALLET --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Wallet className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Payments & Wallet</h2>
          </div>
          
          {/* GoCardless Connection Card */}
          <Card className={cn(
            "overflow-hidden border-2 shadow-sm bg-white dark:bg-slate-800",
            gcStatus?.connected ? "border-emerald-200 dark:border-emerald-800" : "border-blue-200 dark:border-blue-800"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
                      gcStatus?.connected 
                        ? "bg-emerald-600 shadow-emerald-200 dark:shadow-none" 
                        : "bg-blue-600 shadow-blue-200 dark:shadow-none"
                    )}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        Open Banking
                        {gcStatus?.connected && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Check className="w-3 h-3 mr-1" /> Connected
                          </Badge>
                        )}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        {gcStatus?.connected 
                          ? "Players can pay via bank transfer" 
                          : "Connect to receive payments"
                        }
                      </p>
                    </div>
                  </div>

                  {gcStatus?.connected ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Your team is connected to GoCardless and can receive instant bank payments from players.
                      </p>
                      {gcStatus.connectedAt && (
                        <p className="text-xs text-slate-400">
                          Connected on {new Date(gcStatus.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectGcMutation.mutate()}
                        disabled={disconnectGcMutation.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20"
                        data-testid="button-disconnect-gocardless"
                      >
                        {disconnectGcMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Connect your GoCardless account to receive instant bank payments. Players will pay directly from their bank - no cards needed.
                      </p>
                      <Button
                        onClick={() => connectGcMutation.mutate()}
                        disabled={connectGcMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        data-testid="button-connect-gocardless"
                      >
                        {connectGcMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Connect GoCardless
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Wallet Card */}
          <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-800 flex flex-col group active:scale-[0.98] transition-all">
            <button onClick={() => setActiveModal('wallet')} className="p-5 flex-1 text-left">
              <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-200 dark:shadow-none">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
                Team Wallet <ChevronRight className="w-4 h-4 text-slate-300" />
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                View balance, withdraw funds, and manage fee settings
              </p>
            </button>
          </Card>
        </section>

        {/* --- 3. PREFERENCES & LOGS --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Preferences & Logs</h2>
          </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              <div className="p-5 space-y-6">
                <ToggleRow 
                  icon={Mail} 
                  label="Email Alerts" 
                  sub="Receipts for all settlements" 
                  checked={emailAlerts} 
                  onCheckedChange={(v) => updatePref('email', v)}
                  loading={saveMutation.isPending}
                />
                <ToggleRow 
                  icon={Smartphone} 
                  label="Push Notifications" 
                  sub="Real-time app notifications" 
                  checked={pushNotifs} 
                  onCheckedChange={(v) => updatePref('push', v)}
                  loading={saveMutation.isPending}
                />
                <ToggleRow 
                  icon={Calendar} 
                  label="Weekly Activity Digest" 
                  sub="Club summary every Monday" 
                  checked={summaryNotifs} 
                  onCheckedChange={(v) => updatePref('summary', v)}
                  loading={saveMutation.isPending}
                />
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 py-2">
                <SettingsLink 
                  icon={Crown} 
                  label="Subscription Plan" 
                  onClick={() => setActiveModal('subscription')} 
                />
                <SettingsLink 
                  icon={Shield} 
                  label="System Audit Trail" 
                  onClick={() => setActiveModal('audit')} 
                />
                <SettingsLink 
                  icon={HelpCircle} 
                  label="FoulPay Support" 
                  onClick={() => setLocation("/help")} 
                />
              </div>
            </div>
          </Card>
        </section>

        {/* --- 3. DANGER ZONE --- */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-1 text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Danger Zone</h2>
          </div>

          <Card className="border border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/5">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="font-bold text-red-900 dark:text-red-400">Terminate {teamInfo?.name}</h3>
                <p className="text-xs text-red-700/60 dark:text-red-400/60">
                  Wipe all club history and member data.
                </p>
              </div>
              <Button 
                variant="destructive" 
                className="font-bold bg-red-600 hover:bg-red-700 h-10 px-6 rounded-xl shadow-md shadow-red-200 dark:shadow-none"
                onClick={() => setActiveModal('delete-confirm')}
              >
                Delete Team
              </Button>
            </CardContent>
          </Card>
        </section>

        <div className="pt-10 text-center">
          <Button variant="ghost" className="text-slate-400 font-bold hover:text-red-500 transition-colors" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            FoulPay • v1.0.0
          </p>
        </div>
      </div>

      {/* --- MODALS --- */}
      <ManageTeamModal isOpen={activeModal === 'team'} onClose={() => setActiveModal(null)} />
      <ManageCategoriesModal isOpen={activeModal === 'categories'} onClose={() => setActiveModal(null)} />
      <AuditTrailModal isOpen={activeModal === 'audit'} onClose={() => setActiveModal(null)} />
      <SubscriptionManagementModal isOpen={activeModal === 'subscription'} onClose={() => setActiveModal(null)} />
      <AdminWalletModal isOpen={activeModal === 'wallet'} onClose={() => setActiveModal(null)} />

      {/* REWORKED DELETION MODAL */}
      <Dialog open={activeModal === 'delete-confirm'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 p-6 text-white">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
            <DialogTitle className="text-2xl font-black leading-tight">Terminal Action</DialogTitle>
            <DialogDescription className="text-red-100 font-medium opacity-90 mt-2">
              You are about to permanently delete <span className="underline decoration-2 underline-offset-4">{teamInfo?.name}</span>.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmation Required</Label>
              <Input 
                placeholder="Type team name to confirm" 
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="h-12 border-red-100 focus-visible:ring-red-500 font-bold text-base"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                variant="destructive" 
                disabled={deleteConfirmInput !== teamInfo?.name || isDeleting}
                onClick={handleDeleteTeam}
                className="h-12 font-black text-sm rounded-xl uppercase tracking-wider"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : "Confirm Deletion"}
              </Button>
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="h-12 font-bold text-slate-500">
                Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// --- SHARED UI COMPONENTS ---

function ActionCard({ title, desc, icon: Icon, color, onClick }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-800 flex flex-col group active:scale-[0.98] transition-all">
      <button onClick={onClick} className="p-5 flex-1 text-left">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-lg dark:shadow-none", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
          {title} <ChevronRight className="w-4 h-4 text-slate-300" />
        </h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
          {desc}
        </p>
      </button>
    </Card>
  );
}

function SettingsLink({ icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-6"
    >
      <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
        <Icon className="w-5 h-5 opacity-40" />
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, sub, checked, onCheckedChange, loading }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <Label className="text-sm font-black text-slate-900 dark:text-white block leading-tight mb-0.5">{label}</Label>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
