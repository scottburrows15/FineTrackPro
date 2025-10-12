import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import type { PlayerStats, Notification } from "@shared/schema";
import { Trophy, TrendingUp, TrendingDown, Award, Medal, Target, PieChart } from "lucide-react";
import AppLayout from "@/components/ui/app-layout";

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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Performance Overview */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
          <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Your Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400" data-testid="text-unpaid-total">
                {formatCurrency(parseFloat(stats?.totalUnpaid || "0"))}
              </p>
              <p className="text-sm text-muted-foreground">Unpaid</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-paid-total">
                {formatCurrency(parseFloat(stats?.totalPaid || "0"))}
              </p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-league-position">
                {myPosition ? `#${myPosition}` : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Rank</p>
            </div>
          </div>
        </Card>


        {/* Hall of Shame Leaderboard */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Hall of Shame
            </h3>
            <Badge variant="outline">Team Leaderboard</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : analytics?.topOffenders && analytics.topOffenders.length > 0 ? (
            <div className="space-y-3">
              {analytics.topOffenders.slice(0, 10).map((offender, index) => {
                const isCurrentUser = offender.playerId === user.id;
                const getMedalIcon = (position: number) => {
                  switch (position) {
                    case 0: return <Medal className="w-7 h-7 text-yellow-500" />;
                    case 1: return <Medal className="w-7 h-7 text-slate-400" />;
                    case 2: return <Medal className="w-7 h-7 text-orange-600" />;
                    default: return (
                      <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                        {position + 1}
                      </div>
                    );
                  }
                };

                const getBackgroundStyle = (position: number) => {
                  if (isCurrentUser) {
                    return 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 shadow-md';
                  }
                  switch (position) {
                    case 0: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 shadow-md';
                    case 1: return 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm';
                    case 2: return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 shadow-sm';
                    default: return 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700';
                  }
                };

                return (
                  <div
                    key={offender.playerId}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${getBackgroundStyle(index)}`}
                    data-testid={`leaderboard-rank-${index + 1}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getMedalIcon(index)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {offender.playerName}
                          {isCurrentUser && (
                            <Badge variant="default" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {offender.fineCount} fine{offender.fineCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {formatCurrency(offender.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No rankings yet</p>
            </div>
          )}
        </Card>

        {/* Personal Goals */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Keep It Up!
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {parseFloat(stats?.totalUnpaid || "0") === 0 
                ? "✅ All fines paid - You're doing great!"
                : `💰 You have ${formatCurrency(parseFloat(stats?.totalUnpaid || "0"))} in unpaid fines - Almost there!`
              }
            </p>
            {myPosition && myPosition <= 3 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ You're in the top 3 offenders - Time to improve!
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
