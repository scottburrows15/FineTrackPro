import { useEffect, useState } from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PaymentModal from "@/components/payment-modal";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, CreditCard } from "lucide-react";
import type { FineWithDetails } from "@shared/schema";

// Use dummy Stripe public key for testing if not provided
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key_for_testing';

const stripePromise = loadStripe(stripePublicKey);

export default function Payment() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  
  const { data: fines, isLoading } = useQuery<FineWithDetails[]>({
    queryKey: ["/api/fines/my"],
  });

  const unpaidFines = Array.isArray(fines) ? fines.filter((fine: any) => !fine.isPaid) : [];
  
  // Pre-select all fines when they're loaded
  useEffect(() => {
    if (unpaidFines.length > 0 && selectedFineIds.length === 0) {
      setSelectedFineIds(unpaidFines.map(f => f.id));
    }
  }, [unpaidFines.length]);

  const selectedFines = unpaidFines.filter(f => selectedFineIds.includes(f.id));
  const totalAmount = selectedFines.reduce((sum: number, fine: any) => 
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

  const toggleFineSelection = (fineId: string) => {
    setSelectedFineIds(prev => 
      prev.includes(fineId) 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFineIds.length === unpaidFines.length) {
      setSelectedFineIds([]);
    } else {
      setSelectedFineIds(unpaidFines.map(f => f.id));
    }
  };

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
            <div className="flex items-center justify-between">
              <CardTitle>Select Fines to Pay</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                data-testid="button-select-all"
              >
                {selectedFineIds.length === unpaidFines.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unpaidFines.map((fine: any) => (
                <div 
                  key={fine.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  data-testid={`fine-item-${fine.id}`}
                >
                  <Checkbox
                    id={`fine-${fine.id}`}
                    checked={selectedFineIds.includes(fine.id)}
                    onCheckedChange={() => toggleFineSelection(fine.id)}
                    data-testid={`checkbox-fine-${fine.id}`}
                  />
                  <Label 
                    htmlFor={`fine-${fine.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{fine.subcategory?.name || 'Fine'}</div>
                        {fine.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">{fine.description}</div>
                        )}
                      </div>
                      <div className="font-semibold text-foreground flex-shrink-0">
                        {formatCurrency(parseFloat(fine.amount))}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                <span>Total ({selectedFineIds.length} selected)</span>
                <span data-testid="text-total-amount">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedFineIds.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Select at least one fine to proceed with payment</p>
          </Card>
        ) : clientSecret ? (
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
              fineIds={selectedFineIds}
              totalAmount={totalAmount}
            />
          </Elements>
        ) : (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
