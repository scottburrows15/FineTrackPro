import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, AlertCircle, CheckCircle, Clock, Building2, ArrowRight, Banknote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Fine {
  id: string;
  description: string;
  amountMinor: number;
  createdAt: string;
  subcategory: {
    name: string;
    category: {
      name: string;
    };
  };
}

interface PaymentIntent {
  id: string;
  reference: string;
  totalMinor: number;
  currency: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  bankDetails: any;
  fineCount: number;
}

function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [showCreateIntent, setShowCreateIntent] = useState(false);

  // Fetch unpaid fines
  const { data: fines = [], isLoading: finesLoading } = useQuery({
    queryKey: ['/api/fines/my'],
  });

  // Fetch payment intents (will be enabled once backend is connected)
  // const { data: paymentIntents = [], isLoading: intentsLoading } = useQuery({
  //   queryKey: ['/api/payment-intents'],
  // });

  const unpaidFines = fines.filter((fine: Fine) => !fine.isPaid);

  // Mock payment intents for now since API isn't connected yet
  const mockPaymentIntents = [];
  const isLoading = finesLoading;

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: { fineIds: string[]; expiresInHours?: number }) => {
      return apiRequest('/api/payment-intents', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Intent Created",
        description: `Reference: ${data.reference}. Use this reference when making your bank transfer.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-intents'] });
      setSelectedFines([]);
      setShowCreateIntent(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });

  const handleCreatePaymentIntent = () => {
    if (selectedFines.length === 0) {
      toast({
        title: "No Fines Selected",
        description: "Please select at least one fine to create a payment intent.",
        variant: "destructive",
      });
      return;
    }

    createPaymentIntentMutation.mutate({
      fineIds: selectedFines,
      expiresInHours: 72, // 3 days
    });
  };

  const handleFineSelection = (fineId: string, checked: boolean) => {
    if (checked) {
      setSelectedFines([...selectedFines, fineId]);
    } else {
      setSelectedFines(selectedFines.filter(id => id !== fineId));
    }
  };

  const selectedTotal = unpaidFines
    .filter((fine: Fine) => selectedFines.includes(fine.id))
    .reduce((sum: number, fine: Fine) => sum + fine.amountMinor, 0);

  const formatAmount = (amountMinor: number) => {
    return `£${(amountMinor / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'settled':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Settled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">Loading payment information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage your fine payments with automatic bank transfer verification</p>
        </div>
      </div>

      <Tabs defaultValue="fines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fines">Unpaid Fines</TabsTrigger>
          <TabsTrigger value="intents">Payment Intents</TabsTrigger>
        </TabsList>

        <TabsContent value="fines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Outstanding Fines
                  </CardTitle>
                  <CardDescription>
                    Select fines to create a payment intent for bank transfer
                  </CardDescription>
                </div>
                {selectedFines.length > 0 && (
                  <Dialog open={showCreateIntent} onOpenChange={setShowCreateIntent}>
                    <DialogTrigger asChild>
                      <Button>
                        Create Payment Intent ({selectedFines.length} fines)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Payment Intent</DialogTitle>
                        <DialogDescription>
                          This will create a unique reference for bank transfer payment verification.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 space-y-2">
                          <Label className="text-sm font-medium">Selected Fines</Label>
                          {unpaidFines
                            .filter((fine: Fine) => selectedFines.includes(fine.id))
                            .map((fine: Fine) => (
                              <div key={fine.id} className="flex justify-between text-sm">
                                <span>{fine.subcategory.name}</span>
                                <span>{formatAmount(fine.amountMinor)}</span>
                              </div>
                            ))}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>{formatAmount(selectedTotal)}</span>
                          </div>
                        </div>

                        <Alert>
                          <Building2 className="h-4 w-4" />
                          <AlertDescription>
                            After creating the intent, you'll receive bank details and a unique reference 
                            to include in your bank transfer. Payments are automatically verified and matched.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCreatePaymentIntent}
                            disabled={createPaymentIntentMutation.isPending}
                            className="flex-1"
                          >
                            {createPaymentIntentMutation.isPending ? 'Creating...' : 'Create Payment Intent'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowCreateIntent(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {unpaidFines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p>You have no outstanding fines to pay.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unpaidFines.map((fine: Fine) => (
                    <div key={fine.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                      <Checkbox
                        checked={selectedFines.includes(fine.id)}
                        onCheckedChange={(checked) => handleFineSelection(fine.id, !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{fine.subcategory.category.name} - {fine.subcategory.name}</p>
                            {fine.description && (
                              <p className="text-sm text-muted-foreground">{fine.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Issued {formatDistanceToNow(new Date(fine.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatAmount(fine.amountMinor)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedFines.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Selected Total:</span>
                        <span className="font-bold text-lg">{formatAmount(selectedTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Payment Intents
              </CardTitle>
              <CardDescription>
                Track your bank transfer payment intents and their verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockPaymentIntents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRight className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">No payment intents yet</p>
                  <p>Create a payment intent from your unpaid fines to get started with bank transfers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockPaymentIntents.map((intent: PaymentIntent) => (
                    <div key={intent.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Reference: {intent.reference}</p>
                          <p className="text-sm text-muted-foreground">
                            {intent.fineCount} fines • Created {formatDistanceToNow(new Date(intent.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatAmount(intent.totalMinor)}</p>
                          {getStatusBadge(intent.status)}
                        </div>
                      </div>
                      
                      {intent.status === 'pending' && intent.bankDetails && (
                        <Alert>
                          <Building2 className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Bank Transfer Details:</p>
                              <p>Account: {intent.bankDetails.accountName}</p>
                              <p>Sort Code: {intent.bankDetails.sortCode}</p>
                              <p>Account Number: {intent.bankDetails.accountNumber}</p>
                              <p className="font-medium">Reference: {intent.reference}</p>
                              <p className="text-xs text-muted-foreground">
                                Include the reference in your bank transfer for automatic verification
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {intent.status === 'pending' && new Date(intent.expiresAt) < new Date() && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This payment intent has expired. Create a new one to continue.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PaymentsPage;