import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { FineWithDetails, Notification } from "@shared/schema";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";

export default function PlayerFines() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showPaidFines, setShowPaidFines] = useState(false);
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);

  const { data: fines = [], isLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const unpaidFines = fines.filter(fine => !fine.isPaid);
  const allPaidFines = fines.filter(fine => fine.isPaid);

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

  const totalOutstanding = unpaidFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="My Fines"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Compact Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              title: "Outstanding",
              value: unpaidFines.length,
              icon: AlertCircle,
              gradient: "from-red-500 to-orange-500",
              testId: "text-outstanding-count"
            },
            {
              title: "Paid",
              value: allPaidFines.length,
              icon: CheckCircle,
              gradient: "from-emerald-500 to-green-500",
              testId: "text-paid-count"
            },
            {
              title: "Total",
              value: fines.length,
              icon: TrendingUp,
              gradient: "from-blue-500 to-purple-500",
              testId: "text-total-count"
            }
          ].map((item, index) => (
            <Card key={index} className={`p-2 bg-gradient-to-br ${item.gradient} text-white shadow-lg border-0`}>
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-6 h-6 flex items-center justify-center">
                  <item.icon className="h-3 w-3 text-white" />
                </div>
                <p className="text-xs text-white/90">{item.title}</p>
                <p className="text-base font-bold text-white" data-testid={item.testId}>
                  {item.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Merged Pay Section - Simple "Settle Up" */}
        {unpaidFines.length > 0 && (
          <Card className="overflow-hidden">
            {/* Settle Up Section - Clean Header */}
            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Settle Up</h3>
                  <p className="text-xs text-green-200 mt-1">
                    {formatCurrency(totalOutstanding)} • {unpaidFines.length} {unpaidFines.length === 1 ? 'fine' : 'fines'}
                  </p>
                </div>
                <Button
                  onClick={() => setLocation("/payment")}
                  className="bg-white text-green-600 hover:bg-green-50 h-8 px-4 font-semibold shadow-lg text-sm"
                  data-testid="button-pay-outstanding"
                >
                  Pay Now
                </Button>
              </div>
            </div>

            {/* Outstanding Fines Breakdown */}
            <div className="p-3 space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Outstanding Fines
              </div>

              <div className="space-y-2">
                {unpaidFines.map((fine) => (
                  <Card 
                    key={fine.id} 
                    className={`p-2 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${
                      expandedFineId === fine.id ? 'ring-1 ring-blue-500' : ''
                    }`}
                    onClick={() => setExpandedFineId(expandedFineId === fine.id ? null : fine.id)}
                    data-testid={`card-fine-${fine.id}`}
                  >
                    {/* Row 1: Status and Date */}
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="text-xs bg-red-100 text-red-700">
                        Unpaid
                      </Badge>
                      <span className="text-xs text-slate-500">{formatDate(fine.createdAt)}</span>
                    </div>

                    {/* Row 2: Subcategory */}
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {fine.subcategory?.name || 'Fine'}
                    </div>

                    {/* Row 3: Issued by, When, and Amount */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fine.issuedByUser?.firstName || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(fine.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap" data-testid={`text-amount-${fine.id}`}>
                        {formatCurrency(parseFloat(fine.amount))}
                      </p>
                    </div>

                    {/* Expandable Description */}
                    {expandedFineId === fine.id && fine.description && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-700 dark:text-slate-300">{fine.description}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Payment History - Hidden by Default */}
        {allPaidFines.length > 0 && (
          <Card className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment History</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {allPaidFines.length} payment{allPaidFines.length !== 1 ? 's' : ''} total
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaidFines(!showPaidFines)}
                className="text-slate-600 dark:text-slate-400 h-8"
              >
                {showPaidFines ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span className="ml-1 text-xs">{showPaidFines ? "Hide" : "Show"}</span>
              </Button>
            </div>

            {/* Date Filters - Only show when section is expanded */}
            {showPaidFines && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="dateFrom" className="text-xs">From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-7 text-xs"
                        data-testid="input-date-from"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo" className="text-xs">To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-7 text-xs"
                        data-testid="input-date-to"
                      />
                    </div>
                  </div>
                  
                  {(dateFrom || dateTo) && (
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className="h-7 text-xs"
                        data-testid="button-clear-filters"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {paidFines.length === 0 ? (
                  <Card className="p-4 text-center bg-slate-50 dark:bg-slate-900 border-dashed">
                    <Filter className="h-6 w-6 text-slate-400 mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">No payments found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Try adjusting your date filters
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {paidFines.map((fine) => (
                      <Card 
                        key={fine.id} 
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 transition-all"
                        data-testid={`card-fine-paid-${fine.id}`}
                      >
                        {/* Row 1: Status and Date */}
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Paid
                          </Badge>
                          <span className="text-xs text-slate-500">{formatDate(fine.paidAt || fine.createdAt)}</span>
                        </div>

                        {/* Row 2: Subcategory */}
                        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {fine.subcategory?.name || 'Fine'}
                        </div>

                        {/* Row 3: Issued by, When, and Amount */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {fine.issuedByUser?.firstName || 'Admin'}
                            </span>
                            {fine.paidAt && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Paid {formatDate(fine.paidAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                            {formatCurrency(parseFloat(fine.amount))}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Empty States */}
        {isLoading && fines.length === 0 && (
          <Card className="p-6 text-center">
            <div className="animate-spin w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400">Loading your fines...</p>
          </Card>
        )}

        {!isLoading && fines.length === 0 && (
          <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">All Clear! 🎉</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">No fines outstanding</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}