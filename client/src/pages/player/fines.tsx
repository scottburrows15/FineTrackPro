import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { FineWithDetails, Notification } from "@shared/schema";
import { Clock, CheckCircle, AlertCircle, PoundSterling, Calendar, User } from "lucide-react";
import AppLayout from "@/components/ui/app-layout";

export default function PlayerFines() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: fines = [], isLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const unpaidFines = fines.filter(fine => !fine.isPaid);
  const paidFines = fines.filter(fine => fine.isPaid);

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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Outstanding</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="text-outstanding-count">
                  {unpaidFines.length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Paid</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-paid-count">
                  {paidFines.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-total-count">
                  {fines.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Pay Outstanding Button */}
        {unpaidFines.length > 0 && (
          <Button
            onClick={() => setLocation("/payment")}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
            data-testid="button-pay-outstanding"
          >
            <PoundSterling className="mr-2 h-5 w-5" />
            Pay {formatCurrency(unpaidFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0))}
          </Button>
        )}

        {/* Outstanding Fines */}
        {unpaidFines.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-foreground">Outstanding Fines</h2>
            <div className="space-y-3">
              {unpaidFines.map((fine) => (
                <Card 
                  key={fine.id} 
                  className="p-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow"
                  data-testid={`card-fine-${fine.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                          Unpaid
                        </Badge>
                        <span className="font-semibold text-foreground truncate">{fine.subcategory?.name || 'Fine'}</span>
                      </div>
                      {fine.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{fine.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fine.issuedByUser?.firstName || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(fine.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 whitespace-nowrap" data-testid={`text-amount-${fine.id}`}>
                        {formatCurrency(parseFloat(fine.amount))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Paid Fines */}
        {paidFines.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-foreground">Payment History</h2>
            <div className="space-y-3">
              {paidFines.map((fine) => (
                <Card 
                  key={fine.id} 
                  className="p-4 border-l-4 border-l-emerald-500 opacity-75 hover:opacity-100 transition-opacity"
                  data-testid={`card-fine-paid-${fine.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                          Paid
                        </Badge>
                        <span className="font-semibold text-foreground truncate">{fine.subcategory?.name || 'Fine'}</span>
                      </div>
                      {fine.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{fine.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fine.issuedByUser?.firstName || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(fine.createdAt)}
                        </span>
                        {fine.paidAt && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Paid {formatDate(fine.paidAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(parseFloat(fine.amount))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {isLoading && fines.length === 0 && (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading fines...</p>
          </Card>
        )}

        {!isLoading && fines.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Fines Yet!</h3>
            <p className="text-muted-foreground">You're all clear. Keep up the good work!</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
