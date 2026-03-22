import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wallet, ArrowDownToLine, Clock, CheckCircle2, 
  AlertCircle, Loader2, Info, Play, XCircle, Ban, ChevronDown, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@shared/schema";

interface AdminWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletData {
  availableBalance: number;
  availableBalancePounds: string;
  pendingBalance: number;
  pendingBalancePounds: string;
  recentPayouts: Array<{
    id: string;
    amount: number;
    amountPounds: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }>;
}

interface PendingPayment {
  id: string;
  billingRequestId: string;
  playerName: string;
  amount: number;
  fineCount: number;
  status: string;
  createdAt: string;
}

export default function AdminWalletModal({ isOpen, onClose }: AdminWalletModalProps) {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/admin/wallet"],
    enabled: isOpen,
  });

  const { data: pendingPayments, isLoading: pendingLoading } = useQuery<PendingPayment[]>({
    queryKey: ["/api/admin/payments/pending"],
    enabled: isOpen,
  });

  const invalidateAllPaymentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/payments/pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/funds-summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
    queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
  };

  const simulateSuccessMutation = useMutation({
    mutationFn: async (billingRequestId: string) => {
      const res = await apiRequest("POST", `/api/admin/payments/${billingRequestId}/simulate-success`);
      if (!res.ok) throw new Error('Simulation failed');
      return res.json();
    },
    onSuccess: () => {
      invalidateAllPaymentQueries();
      toast({ title: "Success", description: "Payment simulated as successful." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to simulate success.", variant: "destructive" });
    },
  });

  const simulateCancelMutation = useMutation({
    mutationFn: async (billingRequestId: string) => {
      const res = await apiRequest("POST", `/api/admin/payments/${billingRequestId}/simulate-cancel`);
      if (!res.ok) throw new Error('Simulation failed');
      return res.json();
    },
    onSuccess: () => {
      invalidateAllPaymentQueries();
      toast({ title: "Cancelled", description: "Payment simulated as cancelled." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to simulate cancellation.", variant: "destructive" });
    },
  });

  const simulateFailMutation = useMutation({
    mutationFn: async (billingRequestId: string) => {
      const res = await apiRequest("POST", `/api/admin/payments/${billingRequestId}/simulate-fail`);
      if (!res.ok) throw new Error('Simulation failed');
      return res.json();
    },
    onSuccess: () => {
      invalidateAllPaymentQueries();
      toast({ title: "Failed", description: "Payment simulated as failed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to simulate failure.", variant: "destructive" });
    },
  });

  const clearAllPendingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/payments/clear-all-pending");
      if (!res.ok) throw new Error('Failed to clear pending payments');
      return res.json();
    },
    onSuccess: (data: { clearedCount: number }) => {
      invalidateAllPaymentQueries();
      toast({ 
        title: "Cleared", 
        description: `${data.clearedCount} pending payment(s) cleared and fines reset.` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to clear pending payments.", 
        variant: "destructive" 
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amountPence: number) => 
      apiRequest("POST", "/api/admin/wallet/withdraw", { amountPence }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet"] });
      setWithdrawAmount("");
      setIsWithdrawing(false);
      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Unable to process withdrawal.",
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    const amountPounds = parseFloat(withdrawAmount);
    if (isNaN(amountPounds) || amountPounds <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    
    const amountPence = Math.round(amountPounds * 100);
    if (walletData && amountPence > walletData.availableBalance) {
      toast({
        title: "Insufficient funds",
        description: "Withdrawal amount exceeds available balance.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate(amountPence);
  };

  const handleMaxWithdraw = () => {
    if (walletData) {
      setWithdrawAmount((walletData.availableBalance / 100).toFixed(2));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white dark:bg-slate-900 flex flex-col max-h-[85vh] h-[85vh]">
        
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">Team Wallet</DialogTitle>
              <DialogDescription className="text-green-100 text-xs font-medium">
                Manage payments and withdrawals
              </DialogDescription>
            </div>
          </div>

          {walletLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-white/60" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-[10px] font-bold text-green-200 uppercase tracking-wider">Available</p>
                <p className="text-2xl font-black text-white">{walletData?.availableBalancePounds || "£0.00"}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-[10px] font-bold text-green-200 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-white">{walletData?.pendingBalancePounds || "£0.00"}</p>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950">
          <div className="p-5 space-y-6 pb-8">
            
            {!isWithdrawing ? (
              <Button 
                onClick={() => setIsWithdrawing(true)}
                disabled={!walletData || walletData.availableBalance <= 0}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                data-testid="button-withdraw-funds"
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Withdraw Funds
              </Button>
            ) : (
              <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Withdrawal Amount
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-7 h-11 font-bold text-lg"
                          placeholder="0.00"
                          data-testid="input-withdraw-amount"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleMaxWithdraw}
                        className="h-11 px-4 font-bold"
                        data-testid="button-max-withdraw"
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsWithdrawing(false)}
                      className="flex-1 h-10"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending || !withdrawAmount}
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700 font-bold"
                      data-testid="button-confirm-withdraw"
                    >
                      {withdrawMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Confirm Withdrawal"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingPayments && pendingPayments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">
                    <CreditCard className="w-3 h-3 inline mr-1" />
                    Pending Payments ({pendingPayments.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[9px] bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    onClick={() => clearAllPendingMutation.mutate()}
                    disabled={clearAllPendingMutation.isPending}
                  >
                    {clearAllPendingMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Clear All
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {pendingPayments.map((payment) => (
                    <Card key={payment.id} className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-400">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {payment.playerName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {payment.fineCount} fine{payment.fineCount > 1 ? 's' : ''} • £{(payment.amount / 100).toFixed(2)}
                            </p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {payment.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            onClick={() => simulateSuccessMutation.mutate(payment.billingRequestId)}
                            disabled={simulateSuccessMutation.isPending}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Success
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            onClick={() => simulateCancelMutation.mutate(payment.billingRequestId)}
                            disabled={simulateCancelMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            onClick={() => simulateFailMutation.mutate(payment.billingRequestId)}
                            disabled={simulateFailMutation.isPending}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Fail
                          </Button>
                        </div>
                        
                        <p className="text-[9px] text-slate-400 mt-2 font-mono">
                          ID: {payment.billingRequestId}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {walletData?.recentPayouts && walletData.recentPayouts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Recent Withdrawals
                </h3>
                
                <div className="space-y-2">
                  {walletData.recentPayouts.map((payout) => (
                    <Card key={payout.id} className="border-none shadow-sm bg-white dark:bg-slate-800">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {payout.amountPounds}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(payout.status)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
