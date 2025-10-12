import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FineWithDetails, TeamStats, Notification } from "@shared/schema";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Megaphone,
  Clock,
  CheckCircle,
  PoundSterling,
  Calendar
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import AdminShareLink from "@/components/admin-share-link";

export default function AdminHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const recentFines = fines.slice(0, 5);
  const unpaidCount = fines.filter(f => !f.isPaid).length;

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
              <p className="text-sm text-muted-foreground mb-4">
                Welcome to the admin dashboard! Here you can manage your team's fines, view analytics, and track payments.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/admin/fines")}
                  data-testid="button-issue-fine"
                >
                  Issue Fine
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/admin/analytics")}
                  data-testid="button-view-analytics"
                >
                  View Analytics
                </Button>
              </div>
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

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest fines issued to the team</p>
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

          {finesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentFines.length > 0 ? (
            <div className="space-y-3">
              {recentFines.map((fine) => (
                <div
                  key={fine.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    fine.isPaid
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700'
                      : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-700'
                  }`}
                  data-testid={`activity-fine-${fine.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      fine.isPaid 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {fine.isPaid ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {fine.player?.firstName} {fine.player?.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{fine.subcategory?.name || 'Fine'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(fine.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      fine.isPaid 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {formatCurrency(parseFloat(fine.amount))}
                    </p>
                    <Badge 
                      variant={fine.isPaid ? "outline" : "destructive"}
                      className="text-xs"
                    >
                      {fine.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No activity yet</p>
              <p className="text-sm">Start issuing fines to see activity here</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/admin/fines")}
            data-testid="button-quick-issue-fine"
          >
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <span className="font-semibold">Issue Fine</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/admin/analytics")}
            data-testid="button-quick-analytics"
          >
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <span className="font-semibold">Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/admin/settings")}
            data-testid="button-quick-settings"
          >
            <Users className="h-6 w-6 text-purple-500" />
            <span className="font-semibold">Team Settings</span>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
