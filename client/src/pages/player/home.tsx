import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getDisplayName } from "@/lib/userUtils";
import AppLayout from "@/components/ui/app-layout";
import { Skeleton } from "@/components/ui/skeleton";

import type { PlayerStats, Notification, FineWithDetails } from "@shared/schema";
import {
  PoundSterling,
  TrendingDown,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Zap,
  Hourglass,
  Loader2,
  Trophy,
  Medal,
} from "lucide-react";

interface TeamAnalytics {
  topOffenders: Array<{
    playerId: string;
    playerName: string;
    fineCount: number;
    totalAmount: number;
  }>;
}

export default function PlayerHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPaidFines, setShowPaidFines] = useState(false);
  const [showFines, setShowFines] = useState(false);
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/stats/player"],
    enabled: !!user,
  });

  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: analytics } = useQuery<TeamAnalytics>({
    queryKey: ["/api/analytics/team"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const firstName = user ? getDisplayName(user).split(" ")[0] : "Player";
  const totalOutstanding = parseFloat(stats?.totalUnpaid || "0");
  const totalPaid = parseFloat(stats?.totalPaid || "0");

  const payableFines = fines.filter(fine => !fine.isPaid && fine.paymentStatus !== 'pending_payment').sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  const pendingPaymentFines = fines.filter(fine => fine.paymentStatus === 'pending_payment').sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  const allPaidFines = fines.filter(fine => fine.isPaid).sort((a, b) => new Date(b.paidAt || b.createdAt!).getTime() - new Date(a.paidAt || a.createdAt!).getTime());

  const paidFines = useMemo(() => {
    let filtered = allPaidFines;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(fine => {
        const paidDate = fine.paidAt ? new Date(fine.paidAt) : null;
        return paidDate && paidDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(fine => {
        const paidDate = fine.paidAt ? new Date(fine.paidAt) : null;
        return paidDate && paidDate <= toDate;
      });
    }
    return filtered;
  }, [allPaidFines, dateFrom, dateTo]);

  const myRank = analytics?.topOffenders.findIndex(o => o.playerId === user?.id);
  const myPosition = myRank !== undefined && myRank !== -1 ? myRank + 1 : null;

  const isLoading = statsLoading || finesLoading;

  if (!user) {
    return null;
  }

  const toggleFineExpansion = (id: string) => {
    setExpandedFineId(expandedFineId === id ? null : id);
  };

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* Greeting + Pay Button + Expandable Fines */}
        <Card className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="p-4">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold mb-1 truncate text-slate-900 dark:text-white">
                  Hi {firstName}! 👋
                </h2>
                <div className="text-slate-500 dark:text-slate-400 text-sm truncate">
                  {statsLoading ? (
                    <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-slate-700" />
                  ) : totalOutstanding > 0 ? (
                    `You have £${totalOutstanding.toFixed(2)} in outstanding fines`
                  ) : (
                    "You're all caught up!"
                  )}
                </div>
              </div>
              {totalOutstanding > 0 && (
                <Button
                  onClick={() => setLocation("/payment")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0"
                  size="sm"
                >
                  <PoundSterling className="mr-1 h-4 w-4" />
                  Pay £{totalOutstanding.toFixed(2)}
                </Button>
              )}
            </div>

            {payableFines.length > 0 && (
              <button
                onClick={() => setShowFines(!showFines)}
                className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                {showFines ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showFines ? 'Hide' : 'See'} {payableFines.length} outstanding fine{payableFines.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {showFines && payableFines.length > 0 && (
            <div className="px-4 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2">
              {payableFines.map((fine) => (
                <div
                  key={fine.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  onClick={() => toggleFineExpansion(fine.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate">{fine.subcategory?.name || 'Fine Issued'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      {fine.issuedByUser?.firstName || 'Admin'} • {formatDate(fine.createdAt)}
                    </div>
                    {expandedFineId === fine.id && fine.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-600">
                        {fine.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-base font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(parseFloat(fine.amount))}
                    </span>
                    {expandedFineId === fine.id ? (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Overview - 3 columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Total Paid</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  £{totalPaid.toFixed(2)}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Outstanding</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                  £{totalOutstanding.toFixed(2)}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col items-center justify-between h-full text-center">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Hall of Shame</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-8 bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                  #{myPosition || stats?.leaguePosition || "-"}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Empty State */}
        {!isLoading && fines.length === 0 && (
          <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">All Clear! 🎉</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">No fines outstanding. Keep up the good work!</p>
          </Card>
        )}

        {/* Pending Payments */}
        {pendingPaymentFines.length > 0 && (
          <Card className="overflow-hidden shadow-md border-2 border-amber-300/50 bg-amber-50/30 dark:bg-amber-900/10">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center gap-2">
                <Hourglass className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">Payment Processing</h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    {pendingPaymentFines.length} fine{pendingPaymentFines.length !== 1 ? 's' : ''} awaiting bank confirmation
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {pendingPaymentFines.map((fine) => (
                <Card
                  key={fine.id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-l-amber-400 opacity-70 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-tight flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                        {fine.subcategory?.name || 'Fine'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Issued {formatDate(fine.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200 text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                      <p className="text-base font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatCurrency(parseFloat(fine.amount))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center pt-2">
                These fines are awaiting bank transfer confirmation and cannot be paid again.
              </p>
            </div>
          </Card>
        )}

        {/* Hall of Shame Leaderboard */}
        <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hall of Shame</h3>
            </div>
            <Badge variant="outline" className="text-xs">Team Ranking</Badge>
          </div>

          {statsLoading ? (
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
                  if (isCurrentUser) return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700';
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

        {/* Payment History - Accordion */}
        {allPaidFines.length > 0 && (
          <Card className="shadow-lg">
            <Button
              variant="ghost"
              onClick={() => setShowPaidFines(!showPaidFines)}
              className="w-full justify-between p-4 h-auto text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex flex-col items-start">
                <h2 className="text-base font-bold">Payment History</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  View {allPaidFines.length} completed payment{allPaidFines.length !== 1 ? 's' : ''}
                </p>
              </div>
              {showPaidFines ? (
                <ChevronUp className="w-4 h-4 shrink-0 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0 text-slate-500" />
              )}
            </Button>

            {showPaidFines && (
                <div className="px-4 pb-4 space-y-3 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Filter className="h-4 w-4 text-slate-400" /> Filter by Date
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="dateFrom" className="text-xs">From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="dateTo" className="text-xs">To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setDateFrom(""); setDateTo(""); }}
                        className="h-9 w-9 shrink-0 text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {paidFines.length === 0 ? (
                    <Card className="p-4 text-center bg-slate-50 dark:bg-slate-900 border-dashed">
                      <Filter className="h-6 w-6 text-slate-400 mx-auto mb-1 opacity-50" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">No payments found</p>
                    </Card>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {paidFines.map((fine) => (
                        <Card
                          key={fine.id}
                          className="p-3 bg-white dark:bg-slate-800 border-l-4 border-green-500/70 opacity-90 hover:opacity-100 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {fine.subcategory?.name || 'Fine'}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                Paid {formatDate(fine.paidAt || fine.createdAt)}
                              </div>
                            </div>
                            <p className="text-base font-black text-green-600 dark:text-green-400 whitespace-nowrap">
                              {formatCurrency(parseFloat(fine.amount))}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
