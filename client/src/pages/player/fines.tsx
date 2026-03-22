import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FineWithDetails, Notification } from "@shared/schema";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  ChevronDown,
  ChevronUp,
  CreditCard,
  Filter,
  Users,
  X,
  Zap,
  ArrowRight,
  Hourglass,
  Loader2,
  Wallet
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerFines() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showPaidFines, setShowPaidFines] = useState(false);
  const [expandedFineId, setExpandedFineId] = useState<string | null>(null);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);

  const { data: fines = [], isLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { data: teamInfo } = useQuery<{ paymentMode?: string }>({
    queryKey: ["/api/team/info"],
    enabled: !!user,
  });

  const isWalletMode = teamInfo?.paymentMode === 'wallet';

  const { data: walletData } = useQuery<{ balancePence: number }>({
    queryKey: ["/api/wallet/balance"],
    enabled: !!user && isWalletMode,
  });

  const walletPayMutation = useMutation({
    mutationFn: async (fineId: string) => {
      const res = await apiRequest("POST", "/api/wallet/pay-fine", { fineId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setPayingFineId(null);
      toast({
        title: "Fine paid",
        description: `Deducted from your wallet. New balance: £${(data.newBalancePence / 100).toFixed(2)}`,
      });
    },
    onError: (error: any) => {
      setPayingFineId(null);
      const msg = error?.message || "Could not pay from wallet.";
      toast({
        title: "Payment failed",
        description: msg.includes("Insufficient") ? "Not enough funds in your wallet. Please top up first." : msg,
        variant: "destructive",
      });
    },
  });

  const handleWalletPay = (fineId: string) => {
    setPayingFineId(fineId);
    walletPayMutation.mutate(fineId);
  };

  const handlePayAllFromWallet = () => {
    if (unpaidFines.length === 0) return;
    const firstFine = unpaidFines[0];
    handleWalletPay(firstFine.id);
  };

  // Separate fines: unpaid (can be paid now), pending_payment (awaiting confirmation), and paid
  const payableFines = fines.filter(fine => !fine.isPaid && fine.paymentStatus !== 'pending_payment').sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  const pendingPaymentFines = fines.filter(fine => fine.paymentStatus === 'pending_payment').sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  const unpaidFines = payableFines; // alias for compatibility
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

  const totalOutstanding = unpaidFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);
  const totalPaid = allPaidFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);


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
      pageTitle="My Fines"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-4 pt-4 space-y-4">
        
        {/* 1. Refined Summary Cards (F) */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              title: "Outstanding",
              value: unpaidFines.length,
              icon: AlertCircle,
              gradient: "from-red-600 to-orange-500",
              testId: "text-outstanding-count"
            },
            {
              title: "Total Paid",
              value: formatCurrency(totalPaid),
              icon: CreditCard,
              gradient: "from-blue-600 to-indigo-500",
              testId: "text-paid-amount"
            },
            {
              title: "Fines Paid",
              value: allPaidFines.length,
              icon: CheckCircle,
              gradient: "from-emerald-600 to-green-500",
              testId: "text-fines-paid-count"
            }
          ].map((item, index) => (
            <Card key={index} className={`p-3 bg-gradient-to-br ${item.gradient} text-white shadow-lg border-0`}>
              <div className="flex flex-col space-y-1">
                <item.icon className="h-4 w-4 text-white/90" />
                <p className="text-xs text-white/90 font-medium">{item.title}</p>
                <p className="text-sm font-bold text-white" data-testid={item.testId}>
                  {item.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* 2. Top Pay Section (Reinstated - Preferred Design) */}
        {unpaidFines.length > 0 && (
          <Card className="overflow-hidden shadow-xl border-2 border-emerald-500/50">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Settle Up</h3>
                  <p className="text-lg font-extrabold mt-1" data-testid="text-total-outstanding">
                    {formatCurrency(totalOutstanding)}
                  </p>
                  <p className="text-xs text-green-200 mt-1">
                    {unpaidFines.length} {unpaidFines.length === 1 ? 'fine' : 'fines'} outstanding
                  </p>
                  {isWalletMode && walletData && (
                    <p className="text-xs text-green-100 mt-1 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Wallet: £{(walletData.balancePence / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                {isWalletMode ? (
                  <div className="flex flex-col gap-2 items-end">
                    <Button
                      onClick={() => setLocation("/player/wallet")}
                      className="bg-white text-emerald-600 hover:bg-green-50 h-10 px-5 font-bold shadow-lg text-sm flex items-center gap-1"
                      data-testid="button-pay-outstanding"
                    >
                      <Wallet className="w-4 h-4" />
                      My Wallet
                    </Button>
                    {walletData && (
                      <span className="text-xs text-green-100">
                        Balance: £{(walletData.balancePence / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setLocation("/payment")}
                    className="bg-white text-emerald-600 hover:bg-green-50 h-10 px-5 font-bold shadow-lg text-sm flex items-center gap-1"
                    data-testid="button-pay-outstanding"
                  >
                    Pay Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Outstanding Fines Breakdown Header */}
            <div className="p-4 pt-3 pb-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Fines Requiring Payment
              </h4>
            </div>

            {/* Outstanding Fines List */}
            <div className="px-4 pb-4 space-y-3">
              {unpaidFines.map((fine) => (
                <Card 
                  key={fine.id} 
                  className={`p-3 cursor-pointer transition-all bg-white dark:bg-slate-800 border-l-8 
                    ${expandedFineId === fine.id ? 'border-red-700 shadow-md ring-1 ring-red-200' : 'border-red-600/80 hover:border-red-600'}
                  `}
                  onClick={() => toggleFineExpansion(fine.id)}
                  data-testid={`card-fine-${fine.id}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Side: Category and Issued Info */}
                    <div>
                       <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        <Zap className="h-4 w-4 text-red-500" />
                        {fine.subcategory?.name || 'Fine Issued'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fine.issuedByUser?.firstName || 'Admin'}
                        </span>
                        <span>• {formatDate(fine.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Right Side: Amount and Expansion Icon */}
                    <div className="flex flex-col items-end">
                      <p className="text-xl font-black text-red-700 dark:text-red-400 whitespace-nowrap" data-testid={`text-amount-${fine.id}`}>
                        {formatCurrency(parseFloat(fine.amount))}
                      </p>
                      <button className="text-slate-500 hover:text-slate-700 p-1">
                        {expandedFineId === fine.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedFineId === fine.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        {fine.description && (
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Note: <span className="font-normal">{fine.description}</span>
                          </p>
                        )}
                        {isWalletMode && (
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleWalletPay(fine.id); }}
                            disabled={payingFineId === fine.id || !walletData || walletData.balancePence < Math.round(parseFloat(fine.amount) * 100)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 mt-1"
                          >
                            {payingFineId === fine.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : walletData && walletData.balancePence < Math.round(parseFloat(fine.amount) * 100) ? (
                              "Insufficient balance — top up"
                            ) : (
                              <>
                                <Wallet className="w-3 h-3 mr-1" />
                                Pay {formatCurrency(parseFloat(fine.amount))} from Wallet
                              </>
                            )}
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
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
            <p className="text-xs text-slate-600 dark:text-slate-400">No fines outstanding. Keep up the good work!</p>
          </Card>
        )}

        {/* Pending Payments Section - Greyed out fines awaiting confirmation */}
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
                  data-testid={`card-pending-fine-${fine.id}`}
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

        {/* 3. Payment History - Accordion Style */}
        {allPaidFines.length > 0 && (
          <Card className="shadow-lg">
            {/* Header / Toggle Button */}
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

            {/* Content (Filters + List) */}
            <AnimatePresence>
              {showPaidFines && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 space-y-3 overflow-hidden"
                >
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Filter className="h-4 w-4 text-slate-400" /> Filter by Date
                  </div>
                  
                  {/* Date Filters - Cleaner Layout */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="dateFrom" className="text-xs">From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 text-sm"
                        data-testid="input-date-from"
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
                        data-testid="input-date-to"
                      />
                    </div>
                    
                    {(dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className="h-9 w-9 shrink-0 text-slate-500"
                        data-testid="button-clear-filters"
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
                          data-testid={`card-fine-paid-${fine.id}`}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left Side */}
                            <div>
                               <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                  {fine.subcategory?.name || 'Fine'}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3" />
                                  Paid {formatDate(fine.paidAt || fine.createdAt)}
                                </div>
                            </div>

                            {/* Right Side */}
                            <p className="text-base font-black text-green-600 dark:text-green-400 whitespace-nowrap">
                              {formatCurrency(parseFloat(fine.amount))}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
