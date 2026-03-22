import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import {
  Wallet,
  PoundSterling,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

interface WalletBalance {
  balancePence: number;
  walletId: string;
}

interface FeeBreakdown {
  subtotalPence: number;
  facilitatorFeePence: number;
  foulPayFeePence: number;
  totalFeePence: number;
  totalPayablePence: number;
  clubNetPence: number;
}

export default function PlayerWallet() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletBalance>({
    queryKey: ["/api/wallet/balance"],
    enabled: !!user,
  });

  const { data: feePreview } = useQuery<FeeBreakdown>({
    queryKey: ["/api/payments/calculate", selectedAmount],
    queryFn: async () => {
      if (!selectedAmount) return null;
      const res = await apiRequest("POST", "/api/payments/calculate", {
        subtotalPence: selectedAmount,
        mode: "wallet",
      });
      return res.json();
    },
    enabled: !!selectedAmount && selectedAmount >= 100,
  });

  const topupMutation = useMutation({
    mutationFn: async (amountPence: number) => {
      const res = await apiRequest("POST", "/api/wallet/topup", { amountPence });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setSelectedAmount(null);
      setCustomAmount("");
      setShowCustom(false);
      toast({
        title: "Top-up initiated",
        description: "Your wallet will be credited once payment is confirmed.",
      });
    },
    onError: () => {
      toast({
        title: "Top-up failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustom(false);
    setCustomAmount("");
  };

  const handleCustomSubmit = () => {
    const pence = Math.round(parseFloat(customAmount) * 100);
    if (pence >= 100) {
      setSelectedAmount(pence);
    }
  };

  const formatPounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  if (!user) return null;

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="My Wallet"
      unreadNotifications={unreadCount}
      onViewChange={(v) => setLocation(v === "player" ? "/player/home" : "/admin/home")}
      canSwitchView={false}
    >
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-lg rounded-2xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-emerald-100" />
              <span className="text-sm font-medium text-emerald-100">Available Balance</span>
            </div>
            {walletLoading ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              </div>
            ) : (
              <p className="text-4xl font-black text-white mt-1">
                {formatPounds(walletData?.balancePence ?? 0)}
              </p>
            )}
            <p className="text-xs text-emerald-200 mt-3">
              Fines are deducted from your wallet balance automatically when you pay.
            </p>
          </div>
        </Card>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Top Up Wallet
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {TOPUP_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleSelectPreset(amount)}
                className={`
                  flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${selectedAmount === amount && !showCustom
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                  }
                `}
              >
                <PoundSterling className="w-4 h-4 text-slate-500" />
                <span className="text-lg font-bold text-slate-800">
                  {(amount / 100).toFixed(0)}
                </span>
              </button>
            ))}
          </div>

          {!showCustom ? (
            <button
              onClick={() => {
                setShowCustom(true);
                setSelectedAmount(null);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Custom amount</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7 h-12 rounded-xl text-lg font-semibold"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleCustomSubmit}
                disabled={!customAmount || parseFloat(customAmount) < 1}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                Set
              </Button>
            </div>
          )}
        </section>

        {selectedAmount && selectedAmount >= 100 && (
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden mb-6">
            <div className="p-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Payment Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Wallet credit</span>
                  <span className="font-medium text-slate-800">{formatPounds(selectedAmount)}</span>
                </div>
                {feePreview && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Processing fee</span>
                      <span className="font-medium text-slate-500">
                        {formatPounds(feePreview.totalFeePence)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-slate-700">Total to pay</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {formatPounds(feePreview.totalPayablePence)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={() => topupMutation.mutate(selectedAmount)}
                disabled={topupMutation.isPending}
                className="w-full mt-4 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-base"
              >
                {topupMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Top Up {formatPounds(selectedAmount)}
                  </>
                )}
              </Button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                You will be redirected to complete payment via bank transfer
              </p>
            </div>
          </Card>
        )}

        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            How it works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Top up your wallet</p>
                <p className="text-xs text-slate-400">Add funds via bank transfer. Fees only apply on top-ups.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Pay fines instantly</p>
                <p className="text-xs text-slate-400">Fines are deducted from your balance with no extra fees.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Always ready</p>
                <p className="text-xs text-slate-400">Keep your wallet topped up so you can settle fines quickly.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
