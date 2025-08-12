import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

interface DashboardStats {
  totalFines: number;
  totalAmount: string;
  paidAmount: string;
  unpaidAmount: string;
  paymentRate: number;
  activePlayers: number;
  recentActivity: number;
}

interface TimeseriesData {
  date: string;
  fines: number;
  amount: number;
  payments: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  amount: string;
  percentage: number;
}

export function EnhancedDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'fines' | 'amount' | 'payments'>('fines');
  
  // Set up real-time updates
  const { refresh, isOnline } = useRealTimeUpdates({
    enableNotifications: true,
    updateInterval: 30000,
    autoRefreshQueries: ['/api/dashboard/stats', '/api/dashboard/timeseries', '/api/dashboard/categories']
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/dashboard/stats', timeRange],
    retry: 2,
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ['/api/dashboard/timeseries', timeRange, selectedMetric],
    retry: 2,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/dashboard/categories', timeRange],
    retry: 2,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/dashboard/activity'],
    retry: 2,
  });

  const isLoading = statsLoading || timeseriesLoading || categoriesLoading || activityLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Unable to load dashboard</h3>
            <p className="text-muted-foreground">Please check your connection and try again</p>
          </div>
          <Button onClick={() => refresh()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const mockStats: DashboardStats = stats || {
    totalFines: 156,
    totalAmount: "£2,847.50",
    paidAmount: "£2,234.75",
    unpaidAmount: "£612.75",
    paymentRate: 78.5,
    activePlayers: 23,
    recentActivity: 12
  };

  const mockTimeseries: TimeseriesData[] = timeseries || Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
    fines: Math.floor(Math.random() * 10) + 1,
    amount: Math.floor(Math.random() * 500) + 50,
    payments: Math.floor(Math.random() * 8) + 1,
  }));

  const mockCategories: CategoryBreakdown[] = categories || [
    { category: "Late to Training", count: 34, amount: "£680.00", percentage: 35 },
    { category: "Missed Match", count: 18, amount: "£900.00", percentage: 25 },
    { category: "Yellow Card", count: 28, amount: "£420.00", percentage: 20 },
    { category: "Kit Issues", count: 15, amount: "£225.00", percentage: 12 },
    { category: "Other", count: 12, amount: "£180.00", percentage: 8 },
  ];

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'Last 3 Months';
      case 'year': return 'This Year';
    }
  };

  const getGrowthData = () => {
    // Mock growth calculations - in real app, this would come from API
    return {
      fines: { value: 12, isPositive: true },
      amount: { value: 8.5, isPositive: true },
      payments: { value: -3.2, isPositive: false },
      rate: { value: 5.7, isPositive: true },
    };
  };

  const growth = getGrowthData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Team Dashboard</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-time insights for {getTimeRangeLabel().toLowerCase()}
            {!isOnline && (
              <Badge variant="destructive" className="ml-2">
                Offline
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs">Quarter</TabsTrigger>
              <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refresh()}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Fines</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{mockStats.totalFines}</div>
              <div className={`flex items-center text-xs ${growth.fines.isPositive ? 'text-success' : 'text-destructive'}`}>
                {growth.fines.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.fines.value)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{mockStats.recentActivity} this week
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{mockStats.totalAmount}</div>
              <div className={`flex items-center text-xs ${growth.amount.isPositive ? 'text-success' : 'text-destructive'}`}>
                {growth.amount.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.amount.value)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockStats.paidAmount} collected
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payment Rate</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{mockStats.paymentRate}%</div>
              <div className={`flex items-center text-xs ${growth.rate.isPositive ? 'text-success' : 'text-destructive'}`}>
                {growth.rate.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.rate.value)}%
              </div>
            </div>
            <Progress value={mockStats.paymentRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Players</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{mockStats.activePlayers}</div>
              <Badge variant="secondary" className="text-xs">
                {Math.round(mockStats.activePlayers * 0.8)} paid
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockStats.activePlayers - Math.round(mockStats.activePlayers * 0.8)} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card className="card-enhanced">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Activity Trends
              </CardTitle>
              <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fines" className="text-xs">Fines</TabsTrigger>
                  <TabsTrigger value="amount" className="text-xs">Amount</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Interactive chart showing {selectedMetric} over {getTimeRangeLabel().toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Chart visualization would render here with real data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Fine Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockCategories.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {category.count} fines
                    </Badge>
                    <span className="text-muted-foreground">{category.amount}</span>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-success' : 'bg-primary'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {i % 2 === 0 ? 'Payment received' : 'New fine issued'}
                    </span>
                    <Badge variant={i % 2 === 0 ? 'default' : 'secondary'} className="text-xs">
                      {i % 2 === 0 ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {i % 2 === 0 ? 
                      `John Smith paid £15.00 for "Late to Training"` : 
                      `Sarah Jones fined £25.00 for "Missed Match"`
                    }
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {i + 1}h ago
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedDashboard;