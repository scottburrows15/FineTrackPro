import { useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, CheckCircle, AlertCircle, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentModalProps {
  fineIds: string[];
  totalAmount: number;
}

// --- Theme Constant ---
const EMERALD_COLOR = 'bg-emerald-600';

export default function PaymentModal({ fineIds, totalAmount }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for front-end Stripe processing
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  // --- Backend Confirmation Mutation ---
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { paymentIntentId: string; fineIds: string[] }) => {
      return await apiRequest("POST", "/api/confirm-payment", data);
    },
    onSuccess: () => {
      setPaymentSucceeded(true);
      setPaymentFailed(false); // Ensure failure state is reset
      toast({
        title: "Payment Successful",
        description: "Your fines have been paid successfully!",
        className: 'bg-emerald-100 border-emerald-400 text-emerald-800',
      });
      // Invalidate queries for all relevant data
      queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/player"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team"] });
      
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error) => {
      setPaymentFailed(true);
      toast({
        title: "Payment Confirmation Failed",
        description: error instanceof Error ? `Server error: ${error.message}` : "Failed to confirm payment on the server.",
        variant: "destructive",
      });
    },
  });

  // Check for loading state (either Stripe or backend confirmation)
  const isPending = isStripeProcessing || confirmPaymentMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentFailed(false); // Reset fail state on new submission

    if (!stripe || !elements) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait a moment for the payment form to load.",
        variant: "destructive",
      });
      return;
    }

    setIsStripeProcessing(true);

    try {
      // 1. Confirm Payment Intent on Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Use current page URL to allow Stripe to handle redirects if necessary
          return_url: window.location.href, 
        },
        redirect: "if_required",
      });

      if (error) {
        // Handle Stripe Errors (e.g., card declined)
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed by Stripe.",
          variant: "destructive",
        });
        setPaymentFailed(true);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // 2. Stripe Succeeded, Confirm on Backend
        await confirmPaymentMutation.mutateAsync({
          paymentIntentId: paymentIntent.id,
          fineIds,
        });
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
         // Handle 3D Secure/Authentication required flow
         toast({
            title: "Authentication Required",
            description: "Please complete the authentication steps.",
        });
      } else {
        // Catch-all for unknown or pending status
        toast({
          title: "Payment Status Unknown",
          description: "Your payment status is unclear. Check your dashboard shortly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle unexpected network/client errors
      toast({
        title: "Critical Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during payment.",
        variant: "destructive",
      });
      setPaymentFailed(true);
    } finally {
      setIsStripeProcessing(false);
    }
  };

  // --- Success Screen ---
  if (paymentSucceeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="max-w-md mx-auto shadow-2xl border-emerald-400">
          <CardContent className="p-8 text-center">
            <div className={`w-16 h-16 ${EMERALD_COLOR}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
            <p className="text-slate-600 mb-4">
              Your payment of **{formatCurrency(totalAmount)}** for {fineIds.length} fine{fineIds.length !== 1 ? 's' : ''} has been processed.
            </p>
            <p className="text-sm text-slate-500">
              **Redirecting** you back to the fines dashboard...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // --- Main Form ---
  return (
    <Card className="max-w-md mx-auto shadow-2xl border-t-4 border-emerald-600">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-xl font-bold text-slate-800">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <span>Complete Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-emerald-200">
            <div className="flex justify-between items-center font-bold text-xl text-emerald-800">
              <span>Total Amount Due</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              For {fineIds.length} outstanding fine{fineIds.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {paymentFailed && (
              <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start space-x-2"
              >
                  <XCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 font-medium">
                      Payment could not be completed. Please check your card details and try again.
                  </p>
              </motion.div>
          )}

          <form onSubmit={handleSubmit} id="payment-form" className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs text-slate-600 mb-2">
                💳 Select a payment method below. Wallet options (Apple/Google Pay) will appear automatically if available.
              </p>
              
              {/* Ensure stripe and elements are available before rendering PaymentElement */}
              {stripe && elements ? (
                <PaymentElement 
                  options={{
                    layout: "tabs",
                    wallets: {
                      applePay: 'auto',
                      googlePay: 'auto',
                    },
                  }}
                />
              ) : (
                <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className={`w-full ${EMERALD_COLOR} hover:bg-emerald-700 text-white py-3 shadow-md shadow-emerald-500/30`}
                disabled={!stripe || !elements || isPending}
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin w-4 h-4 text-white" />
                    <span>{confirmPaymentMutation.isPending ? 'Confirming...' : 'Processing Payment...'}</span>
                  </div>
                ) : (
                  `Confirm and Pay ${formatCurrency(totalAmount)}`
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/"}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>

            <div className="flex items-start space-x-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>
                <strong>Test Mode Warning:</strong> This is a non-live testing environment. No real funds will be charged.
                Use Stripe's test card (4242...4242) or the available quick payment options to proceed.
              </p>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
