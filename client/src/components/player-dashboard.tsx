import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getDaysOverdue } from "@/lib/utils";
import { getGreeting } from "@/lib/userUtils";
import type { FineWithDetails, PlayerStats } from "@shared/schema";
import { 
  CreditCard, 
  Calendar, 
  Trophy, 
  Clock,
  CheckCircle,
  Plus
} from "lucide-react";

export default function PlayerDashboard() {
  const { user } = useAuth();
  
  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/stats/player"],
  });

  if (finesLoading || statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-slate-200 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gradient-to-r from-slate-200 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unpaidFines = Array.isArray(fines) ? fines.filter((fine: any) => !fine.isPaid) : [];
  const recentActivity = Array.isArray(fines) ? fines.slice(0, 3) : [];

  const handleSettleUp = () => {
    window.location.href = "/payment";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20 min-h-screen">
      {/* Player Stats Header */}
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-blue-200 dark:border-blue-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {getGreeting(user)}
                </h1>
                <p className="text-muted-foreground">Here's your current fine status</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger">
                    {formatCurrency(parseFloat(stats?.totalUnpaid ?? "0"))}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Outstanding</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(parseFloat(stats?.totalPaid ?? "0"))}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Paid this season</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button 
          onClick={handleSettleUp}
          disabled={unpaidFines.length === 0}
          className="bg-gradient-to-r from-success to-secondary text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="text-lg" />
            <span className="text-sm opacity-90">Pay Now</span>
          </div>
          <div className="font-semibold">Settle Up</div>
          <div className="text-sm opacity-90">
            {formatCurrency(unpaidFines.reduce((sum: number, fine: any) => 
              sum + parseFloat(fine.amount), 0
            ))} outstanding
          </div>
        </button>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-blue-500 drop-shadow-sm" />
              <span className="text-sm text-blue-600 dark:text-blue-400">This Month</span>
            </div>
            <div className="font-semibold text-blue-800 dark:text-blue-200">{stats?.monthlyFines ?? 0} Fines</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {formatCurrency(unpaidFines.length * 7.5)} total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="text-yellow-500 drop-shadow-sm" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">League Position</span>
            </div>
            <div className="font-semibold text-yellow-800 dark:text-yellow-200">#{stats?.leaguePosition ?? 'N/A'} of 23</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">On leaderboard</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-purple-500 drop-shadow-sm" />
              <span className="text-sm text-purple-600 dark:text-purple-400">Last Fine</span>
            </div>
            <div className="font-semibold text-purple-800 dark:text-purple-200">
              {Array.isArray(fines) && fines.length > 0 && fines[0].createdAt ? `${getDaysOverdue(fines[0].createdAt)} days ago` : 'None'}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              {Array.isArray(fines) && fines[0]?.subcategory?.name || 'No fines yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Fines */}
      {unpaidFines.length > 0 && (
        <Card className="mb-8 bg-white dark:bg-slate-800 border-red-200 dark:border-red-700 shadow-lg">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Outstanding Fines</h2>
              <Badge variant="destructive" className="animate-pulse">{unpaidFines.length} unpaid</Badge>
            </div>
          </div>
          <div className="divide-y divide-border">
            {unpaidFines.map((fine: any) => (
              <div key={fine.id} className="p-6 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-lg flex items-center justify-center shadow-sm">
                      <i className={`${fine.subcategory?.icon || 'fas fa-gavel'} text-red-600 dark:text-red-400`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {fine.subcategory?.name || 'Fine'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{fine.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued by {fine.issuedByUser?.firstName} • {formatDate(fine.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600 dark:text-red-400 text-lg">
                      {formatCurrency(parseFloat(fine.amount))}
                    </div>
                    <Badge variant="destructive" className="mt-1 animate-pulse">
                      {getDaysOverdue(fine.createdAt)} days overdue
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-t border-border">
            <Button onClick={handleSettleUp} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Pay All Outstanding Fines - {formatCurrency(
                unpaidFines.reduce((sum: number, fine: any) => 
                  sum + parseFloat(fine.amount), 0
                )
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 shadow-lg">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {fines.length > 0 ? (
            fines.map((fine: any) => (
              <div key={fine.id} className="p-6 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    fine.isPaid 
                      ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' 
                      : 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30'
                  }`}>
                    {fine.isPaid ? (
                      <CheckCircle className="text-emerald-500 text-sm" />
                    ) : (
                      <Plus className="text-red-500 text-sm" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {fine.isPaid ? 'Fine paid:' : 'New fine issued:'}
                      </span>{' '}
                      {fine.subcategory?.name} - {formatCurrency(parseFloat(fine.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(fine.isPaid ? fine.paidAt : fine.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No activity yet</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
