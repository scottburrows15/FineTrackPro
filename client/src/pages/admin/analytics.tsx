import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  PoundSterling, 
  TrendingUp, 
  TrendingDown,
  Users, 
  AlertCircle,
  Skull,
  Calendar,
  Flame,
  Clock,
  Target,
  Zap,
  Medal,
  Trophy,
  CheckCircle,
  RefreshCw,
  Activity,
  BarChart3,
  PieChartIcon,
  Loader2
} from "lucide-react";

interface TeamAnalytics {
  totalFines: number;
  totalRevenue: number;
  paidFines: number;
  unpaidFines: number;
  paymentRate: number;
  averageFineAmount: number;
  topOffenders: Array<{
    playerId: string;
    playerName: string;
    fineCount: number;
    totalAmount: number;
  }>;
  categoryBreakdown: Array<{
    categoryName: string;
    count: number;
    amount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    fines: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'fine_issued' | 'payment_made';
    description: string;
    amount: number;
    timestamp: string;
  }>;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { data: analytics, isLoading, error, refetch, isFetching } = useQuery<TeamAnalytics>({
    queryKey: ["/api/analytics/team"],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 60000,
  });

  const stats = useMemo(() => {
    if (!analytics) return null;
    
    const paidCount = analytics.paidFines;
    const unpaidCount = analytics.unpaidFines;
    const totalCount = analytics.totalFines;
    const collectionRate = analytics.paymentRate * 100;
    const avgAmount = analytics.averageFineAmount;
    const totalAmount = analytics.totalRevenue;
    
    const thisMonthFines = analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.fines || 0;
    const lastMonthFines = analytics.monthlyTrends[analytics.monthlyTrends.length - 2]?.fines || 0;
    const monthChange = lastMonthFines > 0 ? ((thisMonthFines - lastMonthFines) / lastMonthFines * 100) : 0;

    return {
      totalCount,
      paidCount,
      unpaidCount,
      collectionRate,
      avgAmount,
      totalAmount,
      thisMonthFines,
      monthChange,
      activePlayers: analytics.topOffenders.length,
    };
  }, [analytics]);

  if (!user || user.role !== 'admin') return null;

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Analytics"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="relative flex flex-col h-[calc(100dvh-140px)] max-w-lg mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white border-slate-200">
              <BarChart3 className="w-3 h-3 mr-1.5 text-blue-500" />
              Team Overview
            </Badge>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 shrink-0"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-analytics"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="pb-24 space-y-5">
            
            {isLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorState onRetry={() => refetch()} />
            ) : !analytics || analytics.totalFines === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* 1. COLLECTION TRACKER */}
                <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-slate-50 p-3 sm:p-4 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full -translate-y-6 sm:-translate-y-8 translate-x-6 sm:translate-x-8" />
                  <div className="relative">
                    <div className="flex justify-between items-end mb-2 sm:mb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </div>
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-tight">Collection Rate</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.collectionRate.toFixed(0)}%</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-bold text-emerald-600">{stats?.paidCount || 0} paid</p>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-400">of {stats?.totalCount || 0} fines</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={stats?.collectionRate || 0} className="h-2.5 sm:h-3 bg-slate-100" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full opacity-80" style={{ width: `${stats?.collectionRate || 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">{stats?.unpaidCount || 0} fines outstanding</span>
                      <Badge variant={stats && stats.collectionRate >= 80 ? "default" : stats && stats.collectionRate >= 60 ? "secondary" : "destructive"} className="text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 shrink-0">
                        {stats && stats.collectionRate >= 80 ? 'Excellent' : stats && stats.collectionRate >= 60 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* 2. CORE KPI GRID */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <StatCard 
                    title="Outstanding" 
                    value={`${stats?.unpaidCount || 0} fines`}
                    icon={AlertCircle} 
                    iconBg="bg-gradient-to-br from-red-400 to-red-600"
                    trend={(stats?.unpaidCount ?? 0) > 0 ? "Action Needed" : undefined}
                    trendColor="text-red-600 bg-red-50" 
                  />
                  <StatCard 
                    title="Active Players" 
                    value={stats?.activePlayers || 0} 
                    icon={Users}
                    iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
                    subtitle="with fines"
                  />
                  <StatCard 
                    title="This Month" 
                    value={stats?.thisMonthFines || 0}
                    icon={Calendar}
                    iconBg="bg-gradient-to-br from-violet-400 to-violet-600"
                    trend={(stats?.monthChange ?? 0) !== 0 ? `${(stats?.monthChange ?? 0) > 0 ? '+' : ''}${(stats?.monthChange ?? 0).toFixed(0)}%` : undefined}
                    trendColor={stats && stats.monthChange > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}
                    trendIcon={stats && stats.monthChange > 0 ? TrendingUp : TrendingDown}
                  />
                  <StatCard 
                    title="Total Value" 
                    value={`£${(stats?.totalAmount || 0).toFixed(0)}`}
                    icon={PoundSterling}
                    iconBg="bg-gradient-to-br from-amber-400 to-amber-600"
                    subtitle={`avg £${(stats?.avgAmount || 0).toFixed(2)}`}
                  />
                </div>

                {/* 3. INSIGHTS TABS */}
                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                  <Tabs defaultValue="categories" className="w-full">
                    <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b border-slate-50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                          <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-[10px] sm:text-xs uppercase tracking-wider">Fine Insights</h3>
                      </div>
                      <TabsList className="h-6 sm:h-7 bg-slate-100/80 p-0.5 rounded-lg shrink-0">
                        <TabsTrigger value="categories" className="text-[9px] sm:text-[10px] h-5 sm:h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          <PieChartIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Types
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="text-[9px] sm:text-[10px] h-5 sm:h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Trends
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <CardContent className="p-3 sm:p-4">
                      <TabsContent value="categories" className="mt-0 space-y-4">
                        {analytics.categoryBreakdown.length > 0 ? (
                          <>
                            <div className="h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={analytics.categoryBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="count"
                                  >
                                    {analytics.categoryBreakdown.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ 
                                      borderRadius: '12px', 
                                      border: 'none', 
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      fontSize: '12px' 
                                    }} 
                                    formatter={(value: number, name: string, props: any) => [
                                      `${value} fines (£${props.payload.amount.toFixed(0)})`,
                                      props.payload.categoryName
                                    ]}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              {analytics.categoryBreakdown.slice(0, 4).map((cat, index) => (
                                <div key={cat.categoryName} className="flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50/50">
                                  <div 
                                    className="w-2 sm:w-2.5 h-6 sm:h-8 rounded-full shrink-0" 
                                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">{cat.categoryName}</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900">{cat.count} <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">• £{cat.amount.toFixed(0)}</span></p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <PieChartIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No category data yet</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="trends" className="mt-0">
                        {analytics.monthlyTrends.length > 0 ? (
                          <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.monthlyTrends}>
                                <defs>
                                  <linearGradient id="colorFines" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="month" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                                  width={30}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '12px'
                                  }} 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="fines" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#colorFines)"
                                  name="Fines"
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="revenue" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#colorRevenue)"
                                  name="Revenue (£)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No trend data yet</p>
                          </div>
                        )}
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>

                {/* 4. PAYMENT VELOCITY */}
                <Card className="border-0 shadow-lg rounded-2xl bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[10px] sm:text-xs uppercase tracking-wider">Payment Velocity</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
                    <VelocityCard 
                      label="Paid" 
                      value={analytics.paidFines} 
                      total={analytics.totalFines}
                      color="emerald"
                    />
                    <VelocityCard 
                      label="Pending" 
                      value={analytics.unpaidFines} 
                      total={analytics.totalFines}
                      color="amber"
                    />
                    <VelocityCard 
                      label="Rate" 
                      value={`${(analytics.paymentRate * 100).toFixed(0)}%`} 
                      showProgress={false}
                      color="blue"
                    />
                  </div>
                </Card>

                {/* 5. HALL OF SHAME */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                        <Skull className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Hall of Shame</h3>
                    </div>
                    <Badge variant="secondary" className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5">
                      Top {Math.min(5, analytics.topOffenders.length)}
                    </Badge>
                  </div>
                  
                  {analytics.topOffenders.length > 0 ? (
                    <div className="bg-white border-0 rounded-2xl divide-y divide-slate-50 shadow-lg overflow-hidden">
                      {analytics.topOffenders.slice(0, 5).map((player, index) => (
                        <div 
                          key={player.playerId} 
                          className={cn(
                            "flex items-center justify-between p-2.5 sm:p-4 transition-all gap-2",
                            index === 0 && "bg-gradient-to-r from-red-50 to-orange-50"
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shadow-sm shrink-0",
                              index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" : 
                              index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                              index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {index === 0 ? <Flame className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                               index === 1 ? <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                               index === 2 ? <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
                               index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">{player.playerName}</p>
                              <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                <span className={cn(
                                  "text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-md",
                                  index === 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                )}>
                                  {player.fineCount} fines
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-black text-slate-900">£{player.totalAmount.toFixed(0)}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">total</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-0 shadow-lg rounded-2xl p-6">
                      <div className="text-center text-slate-400">
                        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No offenders yet</p>
                        <p className="text-xs">The hall of shame will populate as fines are issued</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* 6. RECENT ACTIVITY */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                    </div>
                  </div>
                  
                  {analytics.recentActivity.length > 0 ? (
                    <div className="bg-white border-0 rounded-2xl divide-y divide-slate-50 shadow-lg overflow-hidden">
                      {analytics.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3">
                          <div className={cn(
                            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0",
                            activity.type === 'payment_made' 
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600" 
                              : "bg-gradient-to-br from-red-400 to-red-600"
                          )}>
                            {activity.type === 'payment_made' ? (
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-xs font-medium text-slate-900 truncate">{activity.description}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">
                              {new Date(activity.timestamp).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className={cn(
                            "text-[11px] sm:text-xs font-bold shrink-0",
                            activity.type === 'payment_made' ? "text-emerald-600" : "text-red-600"
                          )}>
                            {activity.type === 'payment_made' ? '+' : ''}£{activity.amount.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-0 shadow-lg rounded-2xl p-6">
                      <div className="text-center text-slate-400">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No activity yet</p>
                        <p className="text-xs">Activity will appear as fines are issued and paid</p>
                      </div>
                    </Card>
                  )}
                </div>

              </>
            )}

          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg,
  trend, 
  trendColor,
  trendIcon: TrendIcon,
  subtitle
}: { 
  title: string;
  value: string | number;
  icon: any;
  iconBg?: string;
  trend?: string;
  trendColor?: string;
  trendIcon?: any;
  subtitle?: string;
}) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl border-0 shadow-lg flex flex-col justify-between min-h-[100px] sm:min-h-[110px] bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100/50 to-slate-50/30 rounded-full -translate-y-4 translate-x-4" />
      <div className="flex justify-between items-start relative gap-1">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0", iconBg || "bg-slate-100")}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        {trend && (
          <span className={cn("text-[8px] sm:text-[9px] font-bold uppercase px-1 sm:px-1.5 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap", trendColor)}>
            {TrendIcon && <TrendIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
            {trend}
          </span>
        )}
      </div>
      <div className="relative mt-auto">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-slate-400 font-bold mb-0.5">{title}</p>
        <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter leading-tight">{value}</p>
        {subtitle && <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function VelocityCard({ 
  label, 
  value, 
  total,
  color,
  showProgress = true
}: {
  label: string;
  value: string | number;
  total?: number;
  color: 'emerald' | 'amber' | 'blue';
  showProgress?: boolean;
}) {
  const percentage = total ? (Number(value) / total) * 100 : 0;
  const colorMap = {
    emerald: 'from-emerald-400 to-emerald-600',
    amber: 'from-amber-400 to-amber-600',
    blue: 'from-blue-400 to-blue-600',
  };
  const bgMap = {
    emerald: 'bg-emerald-50',
    amber: 'bg-amber-50',
    blue: 'bg-blue-50',
  };

  return (
    <div className={cn("p-1.5 sm:p-3 rounded-lg sm:rounded-xl text-center", bgMap[color])}>
      <p className="text-[7px] sm:text-[10px] font-bold text-slate-500 uppercase mb-0.5 leading-tight">{label}</p>
      <p className="text-xs sm:text-lg font-black text-slate-900 leading-tight">{value}</p>
      {showProgress && total && (
        <div className="mt-1 sm:mt-2 h-0.5 sm:h-1 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full bg-gradient-to-r", colorMap[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-[130px] bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-[110px] bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-[350px] bg-slate-100 rounded-2xl" />
      <div className="h-[100px] bg-slate-100 rounded-2xl" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-0 shadow-lg rounded-2xl p-8">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Unable to Load Analytics</h3>
        <p className="text-sm text-slate-500 mb-4">Something went wrong while fetching your data.</p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl p-8">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Data Yet</h3>
        <p className="text-sm text-slate-500">Start issuing fines to see your team analytics here.</p>
      </div>
    </Card>
  );
}
