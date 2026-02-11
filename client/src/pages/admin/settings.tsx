import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import type { Team, Notification } from "@shared/schema";
import { 
  FileText, Shield, 
  LogOut, Bell, HelpCircle, 
  ChevronRight, AlertTriangle, Trash2, Loader2,
  Settings, CreditCard, Building2, Check, ExternalLink, Unlink
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import ManageTeamModal from "@/components/manage-team-modal";
import ManageCategoriesModal from "@/components/manage-categories-modal";
import AuditTrailModal from "@/components/audit-trail-modal";
import AdminWalletModal from "@/components/admin-wallet-modal";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

  const { isSupported: pushSupported, permission: pushPermission, isSubscribed: pushSubscribed, requestPermission: requestPushPermission, unsubscribe: unsubscribePush } = usePushNotifications();

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

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    setTimeout(() => { window.location.href = "/"; }, 2000);
  };

  if (!user || user.role !== 'admin') return null;

  const teamInitial = teamInfo?.name?.[0]?.toUpperCase() || "T";

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Team Settings"
      unreadNotifications={unreadCount}
      onViewChange={(v) => setLocation(v === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {teamInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {teamInfo?.name || "Your Team"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {teamInfo?.sport || "Team settings"}
            </p>
          </div>
        </div>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Team Management</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <SettingsRow
              icon={Settings}
              label="Club Identity"
              subtitle="Team name, sport, and members"
              onClick={() => setActiveModal('team')}
            />
            <Divider />
            <SettingsRow
              icon={FileText}
              label="Fine Rules"
              subtitle="Categories and fine amounts"
              onClick={() => setActiveModal('categories')}
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Payments</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Open Banking</span>
                      {gcStatus?.connected && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                          <Check className="w-2.5 h-2.5 mr-0.5" /> Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {gcStatus?.connected
                        ? `Connected ${gcStatus.connectedAt ? new Date(gcStatus.connectedAt).toLocaleDateString() : ""}`
                        : "Receive instant bank payments"}
                    </p>
                  </div>
                </div>
                {gcStatus?.connected ? (
                  <button
                    onClick={() => disconnectGcMutation.mutate()}
                    disabled={disconnectGcMutation.isPending}
                    className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {disconnectGcMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectGcMutation.mutate()}
                    disabled={connectGcMutation.isPending}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {connectGcMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Connect
                  </button>
                )}
              </div>
            </div>
            <Divider />
            <SettingsRow
              icon={CreditCard}
              label="Team Wallet"
              subtitle="Balance and withdrawals"
              onClick={() => setActiveModal('wallet')}
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Preferences</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Push Notifications</span>
                  {(!pushSupported || pushPermission === "denied") && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {!pushSupported ? "Not supported" : "Blocked in browser"}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={pushSubscribed}
                disabled={!pushSupported || pushPermission === "denied"}
                onCheckedChange={(v) => {
                  if (v) requestPushPermission();
                  else unsubscribePush();
                }}
              />
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Other</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <SettingsRow
              icon={Shield}
              label="Audit Trail"
              onClick={() => setActiveModal('audit')}
            />
            <Divider />
            <SettingsRow
              icon={HelpCircle}
              label="Help & Support"
              onClick={() => setLocation("/help")}
            />
          </div>
        </section>

        <section className="mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-red-100 dark:border-red-900/30">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Team</span>
                  <p className="text-xs text-red-400/70 dark:text-red-500/70 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('delete-confirm')}
                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                Delete <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <button
            onClick={() => { window.location.href = "/api/logout"; }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-center text-[11px] text-slate-300 dark:text-slate-600 mt-3">
            FoulPay v1.0.0
          </p>
        </div>
      </div>

      <ManageTeamModal isOpen={activeModal === 'team'} onClose={() => setActiveModal(null)} />
      <ManageCategoriesModal isOpen={activeModal === 'categories'} onClose={() => setActiveModal(null)} />
      <AuditTrailModal isOpen={activeModal === 'audit'} onClose={() => setActiveModal(null)} />
      <AdminWalletModal isOpen={activeModal === 'wallet'} onClose={() => setActiveModal(null)} />

      <Dialog open={activeModal === 'delete-confirm'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 p-6 text-white">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
            <DialogTitle className="text-2xl font-bold leading-tight">Delete Team</DialogTitle>
            <DialogDescription className="text-red-100 font-medium opacity-90 mt-2">
              You are about to permanently delete <span className="underline underline-offset-4">{teamInfo?.name}</span> and all its data.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Type team name to confirm</Label>
              <Input 
                placeholder={teamInfo?.name || "Team name"} 
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="h-11 border-red-100 focus-visible:ring-red-500 font-medium"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                variant="destructive" 
                disabled={deleteConfirmInput !== teamInfo?.name || isDeleting}
                onClick={handleDeleteTeam}
                className="h-11 font-semibold rounded-lg"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : "Confirm Deletion"}
              </Button>
              <Button variant="ghost" onClick={() => setActiveModal(null)} className="h-11 text-slate-500">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SettingsRow({ icon: Icon, label, subtitle, onClick }: {
  icon: any;
  label: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />;
}
