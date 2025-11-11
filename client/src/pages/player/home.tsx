import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PoundSterling, TrendingDown, TrendingUp, Award, AlertCircle } from "lucide-react";
import { getDisplayName } from "@/lib/userUtils";
import AppLayout from "@/components/ui/app-layout";
import { Skeleton } from "@/components/ui/skeleton";

import type { PlayerStats, Notification } from "@shared/schema";

export default function PlayerHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/stats/player"],
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const firstName = user ? getDisplayName(user).split(" ")[0] : "Player";
  const totalOutstanding = parseFloat(stats?.totalUnpaid || "0");
  const totalPaid = parseFloat(stats?.totalPaid || "0");

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Player Dashboard"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Compact Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 text-white">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-1 truncate" data-testid="text-greeting">
                Hi {firstName}! 👋
              </h2>
              <p className="text-slate-200 text-sm truncate">
                {isLoading ? (
                  <Skeleton className="h-4 w-40 bg-slate-600" />
                ) : totalOutstanding > 0 ? (
                  `You have £${totalOutstanding.toFixed(2)} in outstanding fines`
                ) : (
                  "You're all caught up!"
                )}
              </p>
            </div>
            
            {/* Settle Up Button - Compact */}
            {totalOutstanding > 0 && (
              <Button
                onClick={() => setLocation("/payment")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0"
                size="sm"
                data-testid="button-settle-up"
              >
                <PoundSterling className="mr-1 h-4 w-4" />
                Pay £{totalOutstanding.toFixed(2)}
              </Button>
            )}
          </div>
        </div>

        {/* Improved Stats Grid with Better Mobile Spacing */}
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
          {/* Total Paid */}
          <Card className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 truncate">Total Paid</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 truncate" data-testid="text-total-paid">
                    £{totalPaid.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          {/* Outstanding */}
          <Card className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 truncate">Outstanding</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 truncate" data-testid="text-total-outstanding">
                    £{totalOutstanding.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          {/* League Position */}
          <Card 
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setLocation("/player/stats")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLocation("/player/stats");
              }
            }}
            data-testid="card-league-position"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 truncate">League Position</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-8 bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400 truncate" data-testid="text-league-position">
                    #{stats?.leaguePosition || "-"}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions with White Background */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setLocation("/player/fines")}
            className="h-14 sm:h-16 flex-col gap-1 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700"
            variant="ghost"
            data-testid="button-view-fines"
          >
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">View Fines</span>
          </Button>
          <Button
            onClick={() => setLocation("/player/stats")}
            className="h-14 sm:h-16 flex-col gap-1 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700"
            variant="ghost"
            data-testid="button-view-stats"
          >
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">My Stats</span>
          </Button>
        </div>

        {/* Compact Notifications */}
        {notifications.length > 0 && (
          <Card className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Recent Activity</h3>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 2).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-2 p-2 rounded text-xs ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-900/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    !notification.isRead ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 truncate">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {notifications.length > 2 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-xs text-slate-600 dark:text-slate-400 h-8"
                onClick={() => setLocation("/notifications")}
              >
                View all {notifications.length} notifications
              </Button>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}