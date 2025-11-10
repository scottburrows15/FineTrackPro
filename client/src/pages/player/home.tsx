import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PoundSterling, TrendingDown, TrendingUp, Award } from "lucide-react";
import { getDisplayName } from "@/lib/userUtils";
import AppLayout from "@/components/ui/app-layout";

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

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Dashboard"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Personalized Greeting */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-greeting">
          Hi {firstName}! 👋
        </h2>
        <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base">
          {totalOutstanding > 0 
            ? `You have £${totalOutstanding.toFixed(2)} in outstanding fines` 
            : "You're all caught up!"}
        </p>
      </div>

      {/* Settle Up Button - only show if there are outstanding fines */}
      {totalOutstanding > 0 && (
        <Button
          onClick={() => setLocation("/payment")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          data-testid="button-settle-up"
        >
          <PoundSterling className="mr-2 h-5 w-5" />
          Settle Up - Pay £{totalOutstanding.toFixed(2)}
        </Button>
      )}

      {/* Highlight Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Paid */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-border shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-total-paid">
                £{parseFloat(stats?.totalPaid || "0").toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        {/* Total Outstanding */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-border shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-outstanding">
                £{totalOutstanding.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* League Position */}
        <Card 
          className="p-6 bg-white dark:bg-slate-800 border-border shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
          onClick={() => setLocation("/player/hall-of-shame")}
          data-testid="card-league-position"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">League Position</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-league-position">
                {isLoading ? "..." : `#${stats?.leaguePosition || "-"}`}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/player/fines")}
          className="h-24 flex-col gap-2 border-2"
          data-testid="button-view-fines"
        >
          <TrendingDown className="h-6 w-6 text-red-500" />
          <span className="font-semibold">View Fines</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/player/stats")}
          className="h-24 flex-col gap-2 border-2"
          data-testid="button-view-stats"
        >
          <Award className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">My Stats</span>
        </Button>
      </div>
      </div>
    </AppLayout>
  );
}
