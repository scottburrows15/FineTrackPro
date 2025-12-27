import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wallet, ArrowDownToLine, Clock, CheckCircle2, 
  AlertCircle, Loader2, Banknote, ToggleLeft, Info
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

export default function AdminWalletModal({ isOpen, onClose }: AdminWalletModalProps) {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/admin/wallet"],
    enabled: isOpen,
  });

  const feeSettingsMutation = useMutation({
    mutationFn: async (passFeesToPlayer: boolean) => 
      apiRequest("PATCH", "/api/admin/team/fee-settings", { passFeesToPlayer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/info"] });
      toast({
        title: "Settings updated",
        description: "Fee settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update fee settings.",
        variant: "destructive",
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
      <DialogContent className="max-w-[480px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white dark:bg-slate-900 flex flex-col max-h-[85vh]">
        
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

        <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="p-5 space-y-6">
            
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Fee Settings</h3>
              
              <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="w-4 h-4 text-slate-400" />
                        <Label className="text-sm font-bold text-slate-900 dark:text-white">
                          Pass fees to players
                        </Label>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        When enabled, players pay transaction fees on top of their fines. 
                        When disabled, your team covers the fees.
                      </p>
                    </div>
                    <Switch 
                      checked={teamInfo?.passFeesToPlayer ?? false}
                      onCheckedChange={(checked) => feeSettingsMutation.mutate(checked)}
                      disabled={feeSettingsMutation.isPending}
                      data-testid="toggle-pass-fees"
                    />
                  </div>
                  
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {teamInfo?.passFeesToPlayer 
                          ? "Example: A £2.00 fine will cost the player approximately £2.06 at checkout."
                          : "Example: A £2.00 fine will show as £2.00, with fees deducted from your wallet balance."
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
