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
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Player Stats Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {getGreeting(user)}
                </h1>
                <p className="text-slate-600">Here's your current fine status</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger">
                    {formatCurrency(parseFloat(stats?.totalUnpaid ?? "0"))}
                  </div>
                  <div className="text-sm text-slate-600">Outstanding</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(parseFloat(stats?.totalPaid ?? "0"))}
                  </div>
                  <div className="text-sm text-slate-600">Paid this season</div>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-primary" />
              <span className="text-sm text-slate-600">This Month</span>
            </div>
            <div className="font-semibold text-slate-900">{stats?.monthlyFines ?? 0} Fines</div>
            <div className="text-sm text-slate-600">
              {formatCurrency(unpaidFines.length * 7.5)} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="text-warning" />
              <span className="text-sm text-slate-600">League Position</span>
            </div>
            <div className="font-semibold text-slate-900">#{stats?.leaguePosition ?? 'N/A'} of 23</div>
            <div className="text-sm text-slate-600">On leaderboard</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-slate-400" />
              <span className="text-sm text-slate-600">Last Fine</span>
            </div>
            <div className="font-semibold text-slate-900">
              {Array.isArray(fines) && fines.length > 0 && fines[0].createdAt ? `${getDaysOverdue(fines[0].createdAt)} days ago` : 'None'}
            </div>
            <div className="text-sm text-slate-600">
              {Array.isArray(fines) && fines[0]?.subcategory?.name || 'No fines yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Fines */}
      {unpaidFines.length > 0 && (
        <Card className="mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Outstanding Fines</h2>
              <Badge variant="destructive">{unpaidFines.length} unpaid</Badge>
            </div>
          </div>
          <div className="divide-y divide-slate-200">
            {unpaidFines.map((fine: any) => (
              <div key={fine.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                      <i className={`${fine.subcategory?.icon || 'fas fa-gavel'} text-danger`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {fine.subcategory?.name || 'Fine'}
                      </h3>
                      <p className="text-sm text-slate-600">{fine.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Issued by {fine.issuedByUser?.firstName} • {formatDate(fine.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-danger">
                      {formatCurrency(parseFloat(fine.amount))}
                    </div>
                    <Badge variant="destructive" className="mt-1">
                      {getDaysOverdue(fine.createdAt)} days overdue
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <Button onClick={handleSettleUp} className="w-full">
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
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-200">
          {fines.length > 0 ? (
            fines.map((fine: any) => (
              <div key={fine.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    fine.isPaid ? 'bg-success/10' : 'bg-danger/10'
                  }`}>
                    {fine.isPaid ? (
                      <CheckCircle className="text-success text-sm" />
                    ) : (
                      <Plus className="text-danger text-sm" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">
                        {fine.isPaid ? 'Fine paid:' : 'New fine issued:'}
                      </span>{' '}
                      {fine.subcategory?.name} - {formatCurrency(parseFloat(fine.amount))}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(fine.isPaid ? fine.paidAt : fine.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">
              <p>No activity yet</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
