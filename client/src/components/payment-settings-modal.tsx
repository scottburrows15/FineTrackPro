import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ShieldCheck,
  PlusCircle,
  Wallet,
  Timer,
  Clock,
  CalendarDays,
  Loader2,
  Check,
  PoundSterling,
  Info,
} from "lucide-react";
import type { PaymentMode } from "@shared/schema";

interface PaymentSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface PaymentSettings {
  paymentMode: PaymentMode;
  thresholdAmountPence: number;
  gracePeriodDays: number;
  monthlySweepDay: number;
  passFeesToPlayer: boolean;
}

const MODES: { key: PaymentMode; label: string; icon: any; description: string; detail: string }[] = [
  {
    key: "fee_absorbed",
    label: "Fee Absorbed",
    icon: ShieldCheck,
    description: "Club covers all fees",
    detail: "Players pay the face value of fines. The 20p + 1% facilitator fee and 2% platform fee are deducted from the amount the club receives.",
  },
  {
    key: "fee_surcharged",
    label: "Fee Surcharged",
    icon: PlusCircle,
    description: "Players cover fees",
    detail: "A service fee is added on top of the fine. Players pay Fine + fees, so the club receives the full face value.",
  },
  {
    key: "wallet",
    label: "Pre-paid Wallet",
    icon: Wallet,
    description: "Players top up in advance",
    detail: "Players load credit into their wallet (e.g. £5, £10, £20). Fees only apply on top-up. Fine deductions from the wallet are fee-free.",
  },
  {
    key: "threshold",
    label: "Threshold Batching",
    icon: Timer,
    description: "Batch fines until a minimum",
    detail: "Fines stay in a 'pending' state until the player's total unpaid fines reach the minimum you set. Reduces per-transaction costs.",
  },
  {
    key: "time_limit",
    label: "Time Limit Override",
    icon: Clock,
    description: "Threshold + grace period",
    detail: "Same as Threshold, but fines automatically become payable after a set number of days — regardless of whether the threshold is met.",
  },
  {
    key: "monthly_sweep",
    label: "Monthly Sweep",
    icon: CalendarDays,
    description: "Direct Debit on a set day",
    detail: "All outstanding fines are batched into a single payment on a chosen day each month, minimising the per-transaction fee hit.",
  },
];

export default function PaymentSettingsModal({ open, onClose }: PaymentSettingsModalProps) {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/admin/payment-settings"],
    enabled: open,
  });

  const [selectedMode, setSelectedMode] = useState<PaymentMode>("fee_absorbed");
  const [thresholdPounds, setThresholdPounds] = useState("10.00");
  const [graceDays, setGraceDays] = useState("14");
  const [sweepDay, setSweepDay] = useState("1");

  useEffect(() => {
    if (settings) {
      setSelectedMode(settings.paymentMode || "fee_absorbed");
      setThresholdPounds(((settings.thresholdAmountPence || 1000) / 100).toFixed(2));
      setGraceDays(String(settings.gracePeriodDays || 14));
      setSweepDay(String(settings.monthlySweepDay || 1));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/admin/payment-settings", {
        paymentMode: selectedMode,
        thresholdAmountPence: Math.round(parseFloat(thresholdPounds) * 100),
        gracePeriodDays: parseInt(graceDays),
        monthlySweepDay: parseInt(sweepDay),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      toast({ title: "Settings saved", description: "Payment mode updated successfully." });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const currentMode = MODES.find(m => m.key === selectedMode);

  const exampleFine = 500;
  let exampleCalc = { playerPays: "£5.00", clubGets: "£4.63" };
  if (selectedMode === "fee_absorbed") {
    const fee = 20 + Math.ceil(exampleFine * 0.01) + Math.ceil(exampleFine * 0.02);
    exampleCalc = { playerPays: "£5.00", clubGets: `£${((exampleFine - fee) / 100).toFixed(2)}` };
  } else if (selectedMode === "fee_surcharged") {
    const grossed = Math.ceil((exampleFine + 20) / (1 - 0.03));
    exampleCalc = { playerPays: `£${(grossed / 100).toFixed(2)}`, clubGets: "£5.00" };
  } else if (selectedMode === "wallet") {
    exampleCalc = { playerPays: "£5.00 (from wallet)", clubGets: "£5.00" };
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <CreditCardIcon className="w-5 h-5" />
            Payment Mode
          </DialogTitle>
          <DialogDescription>
            Choose how fines are collected and how fees are distributed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = selectedMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setSelectedMode(mode.key)}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <div className={`text-xs font-semibold ${isActive ? "text-blue-900" : "text-slate-700"}`}>
                      {mode.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {mode.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {currentMode && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">{currentMode.detail}</p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 bg-white rounded-lg p-3 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Player Pays</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{exampleCalc.playerPays}</div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-3 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Club Receives</div>
                    <div className="text-sm font-bold text-emerald-600 mt-0.5">{exampleCalc.clubGets}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 text-center">Example based on a £5.00 fine</div>
              </div>
            )}

            {(selectedMode === "threshold" || selectedMode === "time_limit") && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Minimum Threshold</Label>
                  <div className="relative mt-1">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={thresholdPounds}
                      onChange={(e) => setThresholdPounds(e.target.value)}
                      className="pl-9"
                      placeholder="10.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Fines won't be payable until a player's total reaches this amount.
                  </p>
                </div>

                {selectedMode === "time_limit" && (
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Grace Period (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={graceDays}
                      onChange={(e) => setGraceDays(e.target.value)}
                      className="mt-1"
                      placeholder="14"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      After this many days, fines become payable regardless of the threshold.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedMode === "monthly_sweep" && (
              <div>
                <Label className="text-xs font-semibold text-slate-700">Sweep Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={sweepDay}
                  onChange={(e) => setSweepDay(e.target.value)}
                  className="mt-1"
                  placeholder="1"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  All outstanding fines are collected via Direct Debit on this day each month (1-28).
                </p>
              </div>
            )}

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment Mode
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
