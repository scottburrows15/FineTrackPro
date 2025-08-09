import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  PoundSterling, 
  Target, 
  Calendar,
  Trophy,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading, error } = useQuery<TeamAnalytics>({
    queryKey: ["/api/analytics/team"],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-lg" />
          <div className="h-80 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
          <p>Unable to load team analytics. Please try again later.</p>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p>Start issuing fines to see team analytics here.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team Analytics</h2>
          <p className="text-slate-600">Real-time insights into your team's fine management</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Clock className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFines}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.paidFines} paid, {analytics.unpaidFines} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: £{analytics.averageFineAmount.toFixed(2)} per fine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.paymentRate * 100).toFixed(1)}%</div>
            <Progress value={analytics.paymentRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.paymentRate >= 0.8 ? 'Excellent' : analytics.paymentRate >= 0.6 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.fines || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.monthlyTrends.length >= 2 && (
                <>
                  {analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.fines > 
                   analytics.monthlyTrends[analytics.monthlyTrends.length - 2]?.fines ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-red-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
                  )}
                </>
              )}
              fines this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Fine count and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="fines" fill="#8884d8" name="Fine Count" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (£)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Fine Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Top Offenders and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Offenders */}
        <Card>
          <CardHeader>
            <CardTitle>Top Offenders</CardTitle>
            <CardDescription>Players with most fines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topOffenders.slice(0, 5).map((offender, index) => (
                <div key={offender.playerId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{offender.playerName}</div>
                      <div className="text-sm text-slate-600">{offender.fineCount} fines</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{offender.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-slate-600">total</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest team fine activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'payment_made' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'payment_made' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.description}</div>
                    <div className="text-xs text-slate-600">{new Date(activity.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-medium">
                    £{activity.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}