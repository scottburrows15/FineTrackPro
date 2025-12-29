import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Building2, 
  ShieldCheck, 
  Loader2, 
  Info,
  AlertCircle,
  Check,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTeam } from "@/contexts/TeamContext";
import type { FineWithDetails, User } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";

interface TeamPaymentStatus {
  goCardlessConnected: boolean;
  teamName: string;
  passFeesToPlayer: boolean;
}

interface FeeBreakdown {
  subtotalPence: number;
  foulPayFeePence: number;
  goCardlessFeePence: number;
  totalFeePence: number;
  totalChargePence: number;
  appFeePence: number;
  netWalletCreditPence: number;
}

interface FeePreviewResponse {
  subtotalPounds: string;
  foulPayFeePounds: string;
  goCardlessFeePounds: string;
  totalFeePounds: string;
  totalChargePounds: string;
  absorbFees: boolean;
  breakdown: FeeBreakdown;
}

export default function PaymentPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { activeTeam } = useTeam();
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: finesData, isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: teamInfo, isLoading: teamInfoLoading } = useQuery<TeamPaymentStatus>({
    queryKey: ["/api/team/payment-status"],
  });

  const unpaidFines = useMemo(() => {
    if (!finesData) return [];
    // Filter fines that are not paid and not in pending_payment status
    return finesData.filter(f => !f.isPaid && f.paymentStatus !== 'paid');
  }, [finesData]);

  const pendingPaymentFines = useMemo(() => {
    if (!finesData) return [];
    return finesData.filter(f => f.paymentStatus === 'pending_payment');
  }, [finesData]);

  const availableFines = useMemo(() => {
    // Fines available for selection (not in pending_payment status)
    return unpaidFines.filter(f => f.paymentStatus !== 'pending_payment');
  }, [unpaidFines]);

  const selectedFines = useMemo(() => {
    // Only include fines that are both selected AND available (not pending_payment)
    return availableFines.filter(f => selectedFineIds.includes(f.id));
  }, [availableFines, selectedFineIds]);

  // Clean up selectedFineIds when fines data changes (remove any pending fines)
  useEffect(() => {
    const availableIds = new Set(availableFines.map(f => f.id));
    setSelectedFineIds(prev => {
      const newIds = prev.filter(id => availableIds.has(id));
      // Only update if something was actually removed
      return newIds.length !== prev.length ? newIds : prev;
    });
  }, [availableFines]);

  const subtotalPence = useMemo(() => {
    return selectedFines.reduce((sum, fine) => {
      const amount = typeof fine.amount === 'string' ? parseFloat(fine.amount) : fine.amount;
      return sum + Math.round(amount * 100);
    }, 0);
  }, [selectedFines]);

  const { data: feePreview, isLoading: isPreviewLoading } = useQuery<FeePreviewResponse>({
    queryKey: ["/api/payments/preview", selectedFineIds],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/payments/preview", {
        fineIds: selectedFineIds,
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Fee preview error:", errorText);
        throw new Error("Failed to load fee preview");
      }
      return res.json();
    },
    enabled: selectedFineIds.length > 0,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/create", {
        fineIds: selectedFineIds,
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Payment creation error:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Failed to create payment");
        } catch {
          throw new Error("Failed to create payment - server returned invalid response");
        }
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Payment Created",
          description: "Follow your bank app to complete payment",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(pence / 100);
  };

  const toggleFine = (fineId: string) => {
    // Don't allow toggling fines that are in pending_payment status
    const fine = unpaidFines.find(f => f.id === fineId);
    if (fine?.paymentStatus === 'pending_payment') {
      return;
    }
    
    setSelectedFineIds(prev => 
      prev.includes(fineId) 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const selectAll = () => {
    if (selectedFineIds.length === availableFines.length) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(availableFines.map(f => f.id));
    }
  };

  const handlePayNow = () => {
    if (selectedFineIds.length === 0) {
      toast({
        title: "No fines selected",
        description: "Please select at least one fine to pay",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate();
  };

  const isLoading = finesLoading || teamInfoLoading;

  if (isLoading) {
    return (
      <AppLayout user={user ?? null} pageTitle="Pay Fines" currentView="player">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user ?? null} pageTitle="Pay Fines" currentView="player">
      {/* FIX 1: Mobile Overlap Fix. 
        Using 'sticky top-0' and 'z-50' with background color ensures the alert pushes 
        the UI down rather than floating over it.
      */}
      {!teamInfo?.goCardlessConnected && (
        <div className="sticky top-0 z-50 p-4 bg-slate-50 dark:bg-slate-900 border-b border-red-100 dark:border-red-900/30">
          <Alert variant="destructive" data-testid="alert-payments-unavailable">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payments are not currently available. Your team admin needs to connect a payment provider first.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-lg mx-auto pb-24 pt-4 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/player/home")}
          className="mb-4"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Pay {teamInfo?.teamName || activeTeam?.team.name || "Team"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Instant Bank Transfer</p>
          </div>

          <ScrollArea className="max-h-[50vh]">
            <div className="p-4">
              {unpaidFines.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">All fines paid!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">You have no outstanding fines</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select Fines to Pay
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      className="text-xs h-7"
                      data-testid="button-select-all"
                      disabled={availableFines.length === 0}
                    >
                      {selectedFineIds.length === availableFines.length && availableFines.length > 0 ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  {/* Show pending payment fines first with disabled state */}
                  {pendingPaymentFines.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Processing Payment...
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        {pendingPaymentFines.length} fine(s) are being processed. This may take a few moments.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {unpaidFines.map((fine) => {
                      const isSelected = selectedFineIds.includes(fine.id);
                      const isPending = fine.paymentStatus === 'pending_payment';
                      const amount = typeof fine.amount === 'string' ? parseFloat(fine.amount) : fine.amount;
                      
                      return (
                        <div 
                          key={fine.id}
                          className={`group flex flex-col rounded-lg border transition-all ${
                            isPending
                              ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 opacity-60'
                              : isSelected 
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                          data-testid={`fine-item-${fine.id}`}
                        >
                          <div 
                            className={`flex items-center gap-3 p-4 ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !isPending && toggleFine(fine.id)}
                          >
                            {isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                            ) : (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleFine(fine.id)}
                                className="pointer-events-none"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {fine.subcategory?.name || fine.description || "Fine"}
                                </p>
                                {isPending && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                    Processing
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {fine.subcategory?.category?.name && (
                                  <span className="mr-2">{fine.subcategory.category.name}</span>
                                )}
                                {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : "No date"}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatCurrency(Math.round(amount * 100))}
                            </span>
                          </div>

                          {/* Expandable detail section for specific fine notes.
                            Using standard details/summary for zero-hassle styling.
                          */}
                          {fine.description && (
                            <details className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700/50">
                              <summary className="list-none text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer flex items-center py-2 hover:text-emerald-600 transition-colors">
                                <ChevronDown className="w-3 h-3 mr-1" />
                                View Details
                              </summary>
                              <div className="pt-1 pb-2">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                  "{fine.description}"
                                </p>
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {selectedFineIds.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal ({selectedFineIds.length} fines)</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(subtotalPence)}
                  </span>
                </div>

                {!feePreview?.absorbFees && feePreview && feePreview.breakdown.totalFeePence > 0 && (
                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span>Processing Fee</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3.5 h-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>FoulPay: {feePreview.foulPayFeePounds} + Bank: {feePreview.goCardlessFeePounds}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {feePreview.totalFeePounds}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {feePreview?.totalChargePounds || formatCurrency(subtotalPence)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-snug">
                  Payments powered by <span className="font-bold">GoCardless</span>. 
                  Bank-grade encryption protects your transaction.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Button
              onClick={handlePayNow}
              disabled={selectedFineIds.length === 0 || createPaymentMutation.isPending || isPreviewLoading || !teamInfo?.goCardlessConnected}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg disabled:opacity-50 shadow-md shadow-emerald-100 dark:shadow-none"
              data-testid="button-pay-now"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting to Bank...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5 mr-2" />
                  Pay with Bank
                </>
              )}
            </Button>
            {selectedFineIds.length === 0 && unpaidFines.length > 0 && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                Select fines above to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
