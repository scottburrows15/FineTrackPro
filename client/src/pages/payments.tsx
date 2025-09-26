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
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Building2, 
  ArrowRight, 
  Banknote, 
  Copy,
  RefreshCw,
  QrCode,
  Download,
  CalendarDays,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FineWithDetails } from "@shared/schema";

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

interface BankDetails {
  accountName: string;
  sortCode: string;
  accountNumber: string;
  bankName: string;
}

function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [showCreateIntent, setShowCreateIntent] = useState(false);

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${description} copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  // Fetch unpaid fines
  const { data: fines = [], isLoading: finesLoading } = useQuery<FineWithDetails[]>({
    queryKey: ['/api/fines/my'],
  });

  // Fetch payment intents
  const { data: paymentIntents = [], isLoading: intentsLoading } = useQuery<PaymentIntent[]>({
    queryKey: ['/api/payment-intents'],
  });

  const unpaidFines = fines.filter((fine: FineWithDetails) => !fine.isPaid);
  const isLoading = finesLoading || intentsLoading;

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: { fineIds: string[]; expiresInHours?: number }) => {
      return await apiRequest('POST', '/api/payment-intents', data);
    },
    onSuccess: (data: any) => {
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
    .filter((fine: FineWithDetails) => selectedFines.includes(fine.id))
    .reduce((sum: number, fine: FineWithDetails) => sum + parseFloat(fine.amount), 0);

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `£${numAmount.toFixed(2)}`;
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
                            .filter((fine: FineWithDetails) => selectedFines.includes(fine.id))
                            .map((fine: FineWithDetails) => (
                              <div key={fine.id} className="flex justify-between text-sm">
                                <span>{fine.subcategory.name}</span>
                                <span>{formatAmount(fine.amount)}</span>
                              </div>
                            ))}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>{formatAmount(selectedTotal)}</span>
                          </div>
                        </div>

                        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-medium text-blue-800 dark:text-blue-200">How Bulk Bank Transfer Works:</p>
                              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                                <li>A unique payment reference will be generated for these {selectedFines.length} fines</li>
                                <li>You'll receive complete bank transfer details with copy-to-clipboard options</li>
                                <li>Make a single bank transfer for the total amount with the provided reference</li>
                                <li>Payment is automatically verified and all fines marked as paid within minutes</li>
                                <li>You'll receive email confirmation once processing is complete</li>
                              </ul>
                              <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Total Amount: {formatAmount(selectedTotal)}
                                </span>
                              </div>
                            </div>
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
                  {unpaidFines.map((fine: FineWithDetails) => (
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
                              Issued {formatDistanceToNow(new Date(fine.createdAt || ''), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatAmount(fine.amount)}</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Payment Intents
                  </CardTitle>
                  <CardDescription>
                    Track your bank transfer payment intents and their verification status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/payment-intents'] });
                    toast({
                      title: "Refreshing",
                      description: "Checking for payment updates...",
                    });
                  }}
                  disabled={isLoading}
                  data-testid="refresh-intents"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentIntents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRight className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">No payment intents yet</p>
                  <p>Create a payment intent from your unpaid fines to get started with bank transfers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentIntents.map((intent: PaymentIntent) => (
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
                        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-blue-800 dark:text-blue-200">Bank Transfer Instructions</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const transferDetails = `Bank: ${intent.bankDetails.bankName || 'TeamFines Banking'}
Account Name: ${intent.bankDetails.accountName}
Sort Code: ${intent.bankDetails.sortCode}
Account Number: ${intent.bankDetails.accountNumber}
Amount: ${formatAmount(intent.totalMinor)}
Reference: ${intent.reference}`;
                                    copyToClipboard(transferDetails, "Transfer details");
                                  }}
                                  data-testid="copy-transfer-details"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy All
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                                    <span className="font-medium">Account Name:</span>
                                    <div className="flex items-center gap-2">
                                      <span>{intent.bankDetails.accountName}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(intent.bankDetails.accountName, "Account name")}
                                        data-testid="copy-account-name"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                                    <span className="font-medium">Sort Code:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{intent.bankDetails.sortCode}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(intent.bankDetails.sortCode, "Sort code")}
                                        data-testid="copy-sort-code"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                                    <span className="font-medium">Account Number:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{intent.bankDetails.accountNumber}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(intent.bankDetails.accountNumber, "Account number")}
                                        data-testid="copy-account-number"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                                    <span className="font-medium">Amount:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold">{formatAmount(intent.totalMinor)}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(formatAmount(intent.totalMinor), "Amount")}
                                        data-testid="copy-amount"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Reference:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-yellow-800 dark:text-yellow-200">{intent.reference}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                                        onClick={() => copyToClipboard(intent.reference, "Payment reference")}
                                        data-testid="copy-reference"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                      <CalendarDays className="w-4 h-4" />
                                      <span className="text-xs">
                                        Expires: {formatDistanceToNow(new Date(intent.expiresAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                  <div className="text-xs text-amber-800 dark:text-amber-200">
                                    <p className="font-medium mb-1">Important Instructions:</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                      <li>Use the exact reference code provided above</li>
                                      <li>Transfer the exact amount shown</li>
                                      <li>Payment will be automatically verified within minutes</li>
                                      <li>You'll receive a confirmation once processed</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
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