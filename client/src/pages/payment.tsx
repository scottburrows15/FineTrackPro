import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils"; 
import { ArrowLeft, Check, Zap, Loader2, Building2, ShieldCheck, Info, ExternalLink } from "lucide-react";
import type { FineWithDetails, Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentPreview {
  fineAmountPounds: string;
  foulPayFeePounds: string;
  goCardlessFeePounds: string;
  totalFeePounds: string;
  totalChargePounds: string;
  passFeesToPlayer: boolean;
}

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { data: fines, isLoading: isFinesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const unpaidFines = useMemo(() => 
    Array.isArray(fines) ? fines.filter((fine: FineWithDetails) => !fine.isPaid) : [],
    [fines]
  );
  
  useEffect(() => {
    if (unpaidFines.length > 0 && selectedFineIds.length === 0) {
      setSelectedFineIds(unpaidFines.map(f => f.id));
    }
  }, [unpaidFines.length]);

  const selectedFines = unpaidFines.filter(f => selectedFineIds.includes(f.id));
  const totalAmount = selectedFines.reduce((sum: number, fine: FineWithDetails) => 
    sum + parseFloat(fine.amount), 0
  );

  // Fetch payment preview when fines are selected
  const { data: preview, isLoading: isPreviewLoading } = useQuery<PaymentPreview>({
    queryKey: ['/api/payments/preview', selectedFineIds],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/payments/preview', { fineIds: selectedFineIds });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to load payment preview');
      }
      return res.json();
    },
    enabled: selectedFineIds.length > 0,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/payments/create', { fineIds: selectedFineIds });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorisationUrl) {
        setIsRedirecting(true);
        window.location.href = data.authorisationUrl;
      } else {
        toast({
          title: "Payment Created",
          description: "Redirecting to your bank...",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Could not create payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFineSelection = (fineId: string) => {
    setSelectedFineIds(prev => {
      const isSelected = prev.includes(fineId);
      return isSelected 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId];
    });
  };

  const toggleSelectAll = () => {
    if (selectedFineIds.length === unpaidFines.length) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(unpaidFines.map(f => f.id));
    }
  };

  const handlePayNow = () => {
    createPaymentMutation.mutate();
  };

  if (!user) {
    return null;
  }

  // Loading state
  if (isFinesLoading) {
    return (
      <AppLayout
        user={user}
        currentView="player"
        pageTitle="Pay Fines"
        unreadNotifications={unreadCount}
        onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
        canSwitchView={user.role === 'admin'}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  // No unpaid fines
  if (unpaidFines.length === 0) {
    return (
      <AppLayout
        user={user}
        currentView="player"
        pageTitle="Pay Fines"
        unreadNotifications={unreadCount}
        onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
        canSwitchView={user.role === 'admin'}
      >
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Clear!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You don't have any outstanding fines to pay.
            </p>
            <Button onClick={() => setLocation("/player/home")} data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Redirecting state
  if (isRedirecting) {
    return (
      <AppLayout
        user={user}
        currentView="player"
        pageTitle="Pay Fines"
        unreadNotifications={unreadCount}
        onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
        canSwitchView={user.role === 'admin'}
      >
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Redirecting to Your Bank</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we connect you to your bank's secure payment page...
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Pay Fines"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Back Button */}
        <Button 
          onClick={() => setLocation("/player/home")}
          variant="ghost"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white -ml-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Open Banking Info Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Bank Payment</h3>
                <p className="text-sm text-blue-100">
                  Pay directly from your bank account using Open Banking. Fast, secure, and no card details needed. You'll be redirected to your bank to authorise the payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fine Selection */}
        <Card className="border-2 border-emerald-500/20">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">
                Select Fines ({unpaidFines.length})
              </CardTitle>
              <Button
                variant="link"
                size="sm"
                onClick={toggleSelectAll}
                className="text-emerald-600 hover:text-emerald-700 font-semibold p-0 h-auto"
                data-testid="button-select-all"
              >
                {selectedFineIds.length === unpaidFines.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {unpaidFines.map((fine: FineWithDetails) => {
                const isSelected = selectedFineIds.includes(fine.id);
                return (
                  <div 
                    key={fine.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all 
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    onClick={() => toggleFineSelection(fine.id)}
                    data-testid={`fine-item-${fine.id}`}
                  >
                    <div className="pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFineSelection(fine.id)}
                        className={isSelected ? 'border-emerald-600 bg-emerald-600' : ''}
                        data-testid={`checkbox-fine-${fine.id}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-red-500" />
                        {fine.subcategory?.name || 'Fine'}
                      </div>
                      {fine.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{fine.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{formatDate(fine.createdAt)}</p>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(parseFloat(fine.amount))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        {selectedFineIds.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              ) : preview ? (
                <>
                  {/* Fines subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Fines ({selectedFines.length})</span>
                    <span className="font-medium" data-testid="text-fines-subtotal">£{preview.fineAmountPounds}</span>
                  </div>

                  {/* Fees section - only show if player pays fees */}
                  {preview.passFeesToPlayer && parseFloat(preview.totalFeePounds) > 0 && (
                    <>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Processing fee
                          </span>
                          <span>£{preview.foulPayFeePounds}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>Bank transfer fee</span>
                          <span>£{preview.goCardlessFeePounds}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-bold text-emerald-600" data-testid="text-total-charge">
                      £{preview.totalChargePounds}
                    </span>
                  </div>

                  {!preview.passFeesToPlayer && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      No additional fees - your team covers transaction costs
                    </p>
                  )}
                </>
              ) : (
                <p className="text-center text-slate-500 py-2">Unable to load payment details</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pay Button */}
        <div className="space-y-3">
          <Button
            onClick={handlePayNow}
            disabled={selectedFineIds.length === 0 || createPaymentMutation.isPending || isPreviewLoading}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg"
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

          {/* Security Info */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secured by GoCardless Open Banking</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
