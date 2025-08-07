import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IssueFineModal from "./issue-fine-modal";
import { formatCurrency } from "@/lib/utils";
import type { FineWithDetails, TeamStats } from "@shared/schema";
import { 
  Plus, 
  UserPlus, 
  Users, 
  Gavel, 
  TrendingUp, 
  AlertTriangle,
  Tags,
  Download,
  Settings,
  Edit,
  Check,
  Trash2
} from "lucide-react";

export default function AdminDashboard() {
  const [showIssueFineModal, setShowIssueFineModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ["/api/stats/team"],
  });

  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/team"],
  });

  if (statsLoading || finesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mock leaderboard data for now
  const leaderboard = [
    { id: 1, name: "Marcus Thompson", position: "Striker", totalFines: "127.50", fineCount: 17, emoji: "🥇" },
    { id: 2, name: "David Kumar", position: "Goalkeeper", totalFines: "95.00", fineCount: 12, emoji: "🥈" },
    { id: 3, name: "James Mitchell", position: "Midfielder", totalFines: "72.50", fineCount: 11, emoji: "🥉" },
    { id: 4, name: "Alex Rodriguez", position: "Defender", totalFines: "68.00", fineCount: 9, emoji: "4" },
    { id: 5, name: "Ryan O'Connor", position: "Winger", totalFines: "52.50", fineCount: 8, emoji: "5" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Team Management Dashboard</h1>
                <p className="text-slate-600">Manage fines, players, and team settings</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setShowIssueFineModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Fine</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Add Player</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalPlayers ?? 0}</div>
            <div className="text-sm text-slate-600">Active Players</div>
            <div className="text-xs text-success mt-1">+2 this month</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-danger" />
              </div>
              <span className="text-xs text-slate-500">Outstanding</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(parseFloat(stats?.outstandingFines ?? "0"))}
            </div>
            <div className="text-sm text-slate-600">Unpaid Fines</div>
            <div className="text-xs text-danger mt-1">15 players affected</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <span className="text-xs text-slate-500">This Month</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(parseFloat(stats?.monthlyCollection ?? "0"))}
            </div>
            <div className="text-sm text-slate-600">Collected</div>
            <div className="text-xs text-success mt-1">+12% vs last month</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <span className="text-xs text-slate-500">This Week</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.weeklyFines ?? 0}</div>
            <div className="text-sm text-slate-600">New Fines</div>
            <div className="text-xs text-slate-600 mt-1">6 different categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Team Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3">
                  <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-danger text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">View Unpaid Fines</div>
                    <div className="text-xs text-slate-600">15 players with outstanding fines</div>
                  </div>
                </button>

                <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Tags className="text-primary text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Manage Categories</div>
                    <div className="text-xs text-slate-600">Edit fine types and amounts</div>
                  </div>
                </button>

                <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Download className="text-secondary text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Export Data</div>
                    <div className="text-xs text-slate-600">Download CSV reports</div>
                  </div>
                </button>

                <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-400/10 rounded-lg flex items-center justify-center">
                    <Settings className="text-slate-600 text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Team Settings</div>
                    <div className="text-xs text-slate-600">Invite codes, permissions</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Team Leaderboard</h3>
                <div className="flex space-x-2">
                  <Button size="sm" className="text-xs">Season</Button>
                  <Button size="sm" variant="outline" className="text-xs">Month</Button>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {leaderboard.map((player, index) => (
                  <div key={player.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-warning' : 
                        index === 1 ? 'text-slate-400' : 
                        index === 2 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {player.emoji}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{player.name}</div>
                        <div className="text-sm text-slate-600">{player.position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(parseFloat(player.totalFines))}
                      </div>
                      <div className="text-xs text-slate-600">{player.fineCount} fines</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Fines Management */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <h3 className="text-lg font-semibold text-slate-900">Recent Fines</h3>
            <div className="flex space-x-2">
              <select className="text-sm border border-slate-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>All Categories</option>
                <option>Training</option>
                <option>Match Day</option>
                <option>Social</option>
              </select>
              <select className="text-sm border border-slate-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>All Status</option>
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
            <div className="col-span-4">Player & Fine</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        {/* Example Fine Entries */}
        <div className="divide-y divide-slate-200">
          <div className="p-6 hover:bg-slate-50 transition-colors">
            <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-2 md:space-y-0">
              <div className="md:col-span-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">JM</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">James Mitchell</div>
                    <div className="text-sm text-slate-600">Late Arrival - 15 minutes</div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 hidden md:block">
                <Badge className="bg-blue-100 text-blue-800">Training</Badge>
              </div>
              <div className="md:col-span-2 hidden md:block">
                <span className="font-semibold text-slate-900">£5.00</span>
              </div>
              <div className="md:col-span-2 hidden md:block">
                <Badge variant="destructive">3 days overdue</Badge>
              </div>
              <div className="md:col-span-2">
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Issue Fine Modal */}
      {showIssueFineModal && (
        <IssueFineModal 
          isOpen={showIssueFineModal}
          onClose={() => setShowIssueFineModal(false)}
        />
      )}
    </div>
  );
}
