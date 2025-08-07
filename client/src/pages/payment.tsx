import { useEffect, useState } from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaymentModal from "@/components/payment-modal";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { FineWithDetails } from "@shared/schema";

// Use dummy Stripe public key for testing if not provided
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key_for_testing';

const stripePromise = loadStripe(stripePublicKey);

export default function Payment() {
  const [clientSecret, setClientSecret] = useState("");
  
  const { data: fines, isLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const unpaidFines = Array.isArray(fines) ? fines.filter((fine: any) => !fine.isPaid) : [];
  const totalAmount = unpaidFines.reduce((sum: number, fine: any) => 
    sum + parseFloat(fine.amount), 0
  );

  useEffect(() => {
    if (totalAmount > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch(console.error);
    }
  }, [totalAmount]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (unpaidFines.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>No Outstanding Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              You don't have any unpaid fines at the moment.
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button 
            onClick={() => window.location.href = "/"}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Settle Outstanding Fines</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidFines.map((fine: any) => (
                <div key={fine.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{fine.subcategory?.name || 'Fine'}</div>
                    <div className="text-sm text-slate-600">{fine.description}</div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(parseFloat(fine.amount))}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1E40AF',
                  colorBackground: '#ffffff',
                  colorText: '#1e293b',
                  colorDanger: '#dc2626',
                  borderRadius: '8px',
                }
              },
              loader: 'auto'
            }}
          >
            <PaymentModal 
              fineIds={unpaidFines.map((f: any) => f.id)}
              totalAmount={totalAmount}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
