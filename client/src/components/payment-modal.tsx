import { useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  fineIds: string[];
  totalAmount: number;
}

export default function PaymentModal({ fineIds, totalAmount }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { paymentIntentId: string; fineIds: string[] }) => {
      return await apiRequest("POST", "/api/confirm-payment", data);
    },
    onSuccess: () => {
      setPaymentSucceeded(true);
      toast({
        title: "Payment Successful",
        description: "Your fines have been paid successfully!",
      });
      // Invalidate queries to refresh the UI
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
      toast({
        title: "Payment Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded, now confirm on the backend
        await confirmPaymentMutation.mutateAsync({
          paymentIntentId: paymentIntent.id,
          fineIds,
        });
      } else {
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed. Please wait...",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 mb-4">
            Your payment of {formatCurrency(totalAmount)} has been processed successfully.
          </p>
          <p className="text-sm text-slate-500">
            Redirecting you back to the dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Complete Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Payment for {fineIds.length} fine{fineIds.length !== 1 ? 's' : ''}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <PaymentElement 
                options={{
                  layout: "tabs",
                }}
              />
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-success hover:bg-emerald-700 text-white py-3"
                disabled={!stripe || !elements || isProcessing || confirmPaymentMutation.isPending}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  `Pay ${formatCurrency(totalAmount)}`
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/"}
                disabled={isProcessing || confirmPaymentMutation.isPending}
              >
                Cancel
              </Button>
            </div>

            <div className="flex items-start space-x-2 text-xs text-slate-500">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Demo Mode:</strong> This is a test environment. No real payments will be processed.
                Use test card 4242 4242 4242 4242, or try the quick payment options above if available on your device.
              </p>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
