import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, CreditCard, Calendar, User, PoundSterling } from "lucide-react";
import type { FineWithDetails } from "@shared/schema";

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fine?: FineWithDetails;
}

export default function ManualPaymentModal({ isOpen, onClose, fine }: ManualPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    paymentMethod: "",
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: "",
    notes: "",
    amount: fine?.amount || "",
  });

  const recordPayment = useMutation({
    mutationFn: async (data: any) => {
      if (!fine) throw new Error("No fine selected");
      return await apiRequest("POST", `/api/admin/fines/${fine.id}/record-payment`, data);
    },
    onSuccess: () => {
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(parseFloat(formData.amount))} has been recorded for ${getDisplayName(fine?.player)}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      paymentMethod: "",
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: "",
      notes: "",
      amount: fine?.amount || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentMethod || !formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and confirm the amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    recordPayment.mutate(formData);
  };

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: PoundSterling },
    { value: "bank_transfer", label: "Bank Transfer", icon: CreditCard },
    { value: "card", label: "Debit/Credit Card", icon: CreditCard },
    { value: "paypal", label: "PayPal", icon: CreditCard },
    { value: "other", label: "Other", icon: CreditCard },
  ];

  if (!fine) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Record Manual Payment</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Fine Details */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Player:</span>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="font-medium">{getDisplayName(fine.player)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Fine Type:</span>
            <Badge variant="outline" className="text-xs">
              {fine.subcategory.name}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Original Amount:</span>
            <span className="font-medium">{formatCurrency(parseFloat(fine.amount))}</span>
          </div>
          
          {fine.description && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-600">{fine.description}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select 
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center space-x-2">
                      <method.icon className="w-4 h-4" />
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              value={formData.transactionId}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
              placeholder="Bank ref, PayPal ID, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Payment Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional details about this payment..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={recordPayment.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={recordPayment.isPending || !formData.paymentMethod || !formData.amount}
            >
              {recordPayment.isPending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}