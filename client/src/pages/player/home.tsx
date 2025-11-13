import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PoundSterling, TrendingDown, TrendingUp, Award } from "lucide-react";
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

        {/* Stats Grid - Taller cards with 3-row layout */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Total Paid */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              {/* Row 1: Icon */}
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              {/* Row 2: Title */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Total Paid
              </p>
              
              {/* Row 3: Data (Centered) */}
              {isLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-total-paid">
                  £{totalPaid.toFixed(2)}
                </p>
              )}
            </div>
          </Card>

          {/* Outstanding */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              {/* Row 1: Icon */}
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              
              {/* Row 2: Title */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Outstanding
              </p>
              
              {/* Row 3: Data (Centered) */}
              {isLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-outstanding">
                  £{totalOutstanding.toFixed(2)}
                </p>
              )}
            </div>
          </Card>

          {/* League Position */}
          <Card 
            className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px] cursor-pointer hover:shadow-md transition-all"
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
            <div className="flex flex-col items-center justify-between h-full text-center">
              {/* Row 1: Icon */}
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              
              {/* Row 2: Title */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                League Position
              </p>
              
              {/* Row 3: Data (Centered) */}
              {isLoading ? (
                <Skeleton className="h-6 w-8 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-league-position">
                  #{stats?.leaguePosition || "-"}
                </p>
              )}
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
      </div>
    </AppLayout>
  );
}