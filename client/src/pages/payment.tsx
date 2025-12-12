import { useEffect, useState, useMemo } from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PaymentModal from "@/components/payment-modal";
import { formatCurrency, formatDate } from "@/lib/utils"; 
import { ArrowLeft, CreditCard, Check, Zap, Loader2 } from "lucide-react";
import type { FineWithDetails } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

// --- Configuration ---
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey || stripePublicKey === 'pk_test_dummy_key_for_testing') {
  console.error("VITE_STRIPE_PUBLIC_KEY is missing or invalid. Payment features disabled.");
}

// Load Stripe if key is present
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// --- Primary Color Constant for Theme Consistency ---
const PRIMARY_COLOR = '#059669'; // Tailwind emerald-600

export default function Payment() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  
  const { data: fines, isLoading: isFinesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const unpaidFines = useMemo(() => 
    Array.isArray(fines) ? fines.filter((fine: FineWithDetails) => !fine.isPaid) : [],
    [fines]
  );
  
  useEffect(() => {
    if (unpaidFines.length > 0 && selectedFineIds.length === 0) {
      setSelectedFineIds(unpaidFines.map(f => f.id));
    }
  }, [unpaidFines.length, unpaidFines]);

  const selectedFines = unpaidFines.filter(f => selectedFineIds.includes(f.id));
  const totalAmount = selectedFines.reduce((sum: number, fine: FineWithDetails) => 
    sum + parseFloat(fine.amount), 0
  );

  // --- Payment Intent Fetching ---
  useEffect(() => {
    if (totalAmount > 0) {
      setIsStripeLoading(true);
      setClientSecret("");

      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error("Error creating payment intent:", error);
        })
        .finally(() => {
          setIsStripeLoading(false);
        });
    } else {
      setClientSecret("");
    }
  }, [totalAmount]);

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

  // --- Loading/Empty States ---
  if (isFinesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (unpaidFines.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center shadow-lg">
          <CardHeader>
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <CardTitle className="text-xl font-bold">All Clear!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              You don't have any unpaid fines outstanding.
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fines Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Payment View ---
  return (
    <div className="min-h-screen bg-slate-50 pb-8 pt-4"> {/* Adjusted bottom padding now that sticky bar is removed */}
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Simplified Header */}
        <div className="mb-6">
          <Button 
            onClick={() => window.location.href = "/"}
            variant="ghost"
            className="mb-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fines
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <CreditCard className="w-5 h-5 text-emerald-600" />
             Settle Outstanding Fines
          </h1>
        </div>

        {/* Fine Selection Card */}
        <Card className="mb-6 shadow-lg border-2 border-emerald-500/10">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-800">
                Fines to Pay ({unpaidFines.length} Total)
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
                    className={`flex items-start gap-4 p-3 rounded-xl border cursor-pointer transition-all 
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    onClick={() => toggleFineSelection(fine.id)}
                    data-testid={`fine-item-${fine.id}`}
                  >
                    <div className="pt-1">
                      <Checkbox
                        id={`fine-${fine.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => { 
                            if (checked !== isSelected) toggleFineSelection(fine.id) 
                        }} 
                        className={`w-5 h-5 transition-colors ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}
                        data-testid={`checkbox-fine-${fine.id}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-red-500" />
                        {fine.subcategory?.name || 'Fine'}
                      </div>
                      {fine.description && (
                        <div className="text-sm text-slate-500 mt-0.5 line-clamp-1">{fine.description}</div>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 flex-shrink-0 text-right">
                      {formatCurrency(parseFloat(fine.amount))}
                      <div className="text-xs text-slate-400 font-medium">{formatDate(fine.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form (The Modal Component) */}
        <div className="pb-8"> {/* Added bottom padding to ensure content doesn't get cut off at the bottom */}
          {selectedFineIds.length === 0 ? (
            <Card className="p-8 text-center border-dashed bg-white">
              <p className="text-slate-500 font-medium">Please select at least one fine above to proceed to payment.</p>
            </Card>
          ) : !stripePublicKey ? (
             <Card className="p-4 text-center bg-red-50 border-red-200">
               <p className="text-red-700 font-medium">Payment Error: Stripe key is missing.</p>
             </Card>
          ) : clientSecret && stripePromise ? (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: PRIMARY_COLOR,
                    colorBackground: '#ffffff',
                    colorText: '#1e293b',
                    colorDanger: '#dc2626',
                    borderRadius: '8px',
                  }
                },
                loader: 'auto'
              }}
            >
              {/* PaymentModal contains the payment form and the final action button */}
              <PaymentModal 
                fineIds={selectedFineIds}
                totalAmount={totalAmount}
              />
            </Elements>
          ) : isStripeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
            </div>
          ) : (
             <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
               <p className="text-yellow-700 font-medium">Could not initialize payment. Please refresh or contact admin.</p>
             </Card>
          )}
        </div>
      </div>
    </div>
  );
}
