import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import type { PlayerStats, Notification } from "@shared/schema";
import { Trophy, TrendingUp, TrendingDown, Award, Medal, PieChart, Calendar } from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamAnalytics {
  topOffenders: Array<{
    playerId: string;
    playerName: string;
    fineCount: number;
    totalAmount: number;
  }>;
}

export default function PlayerStatsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/stats/player"],
  });

  const { data: analytics } = useQuery<TeamAnalytics>({
    queryKey: ["/api/analytics/team"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const myRank = analytics?.topOffenders.findIndex(o => o.playerId === user?.id);
  const myPosition = myRank !== undefined && myRank !== -1 ? myRank + 1 : null;

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="My Stats"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Performance Overview Cards - 3 column layout */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Unpaid Card */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Unpaid
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400" data-testid="text-unpaid-total">
                  {formatCurrency(parseFloat(stats?.totalUnpaid || "0"))}
                </p>
              )}
            </div>
          </Card>

          {/* Paid Card */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Paid
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-paid-total">
                  {formatCurrency(parseFloat(stats?.totalPaid || "0"))}
                </p>
              )}
            </div>
          </Card>

          {/* Rank Card */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Your Rank
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-league-position">
                  {myPosition ? `#${myPosition}` : 'N/A'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Additional Stats Cards - 2 column layout */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Total Fines Card */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2">
                <PieChart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Total Fines
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalFines || 0}
                </p>
              )}
            </div>
          </Card>

          {/* Avg. Days to Pay Card */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                Avg. Pay Time
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.averageDaysToPay ? `${stats.averageDaysToPay.toFixed(1)}d` : 'N/A'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Hall of Shame Leaderboard */}
        <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hall of Shame</h3>
            </div>
            <Badge variant="outline" className="text-xs">Team Ranking</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-700" />
                    <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : analytics?.topOffenders && analytics.topOffenders.length > 0 ? (
            <div className="space-y-2">
              {analytics.topOffenders.slice(0, 8).map((offender, index) => {
                const isCurrentUser = offender.playerId === user.id;
                const getMedalIcon = (position: number) => {
                  switch (position) {
                    case 0: return <Medal className="w-6 h-6 text-yellow-500" />;
                    case 1: return <Medal className="w-6 h-6 text-slate-400" />;
                    case 2: return <Medal className="w-6 h-6 text-orange-500" />;
                    default: return (
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {position + 1}
                      </div>
                    );
                  }
                };

                const getBackgroundStyle = (position: number) => {
                  if (isCurrentUser) {
                    return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700';
                  }
                  switch (position) {
                    case 0: return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700';
                    case 1: return 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600';
                    case 2: return 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700';
                    default: return 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700';
                  }
                };

                return (
                  <div
                    key={offender.playerId}
                    className={`flex items-center justify-between p-3 rounded-lg ${getBackgroundStyle(index)}`}
                    data-testid={`leaderboard-rank-${index + 1}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getMedalIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {offender.playerName}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="default" className="text-xs px-1.5 py-0">You</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {offender.fineCount} fine{offender.fineCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(offender.totalAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No rankings available</p>
            </div>
          )}
        </Card>

        {/* Personal Status Card */}
        {(parseFloat(stats?.totalUnpaid || "0") > 0 || (myPosition && myPosition <= 3)) && (
          <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Your Status</h4>
                <div className="space-y-1">
                  {parseFloat(stats?.totalUnpaid || "0") === 0 ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      ✅ All fines paid - You're doing great!
                    </p>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      💰 You have {formatCurrency(parseFloat(stats?.totalUnpaid || "0"))} in unpaid fines
                    </p>
                  )}
                  {myPosition && myPosition <= 3 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ You're in the top 3 offenders - Time to improve!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}