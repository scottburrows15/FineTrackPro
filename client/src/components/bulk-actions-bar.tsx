import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  CreditCard, 
  X,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FineWithDetails } from "@shared/schema";

interface BulkActionsBarProps {
  selectedFines: FineWithDetails[];
  onClearSelection: () => void;
  onShowPaymentModal: (fines: FineWithDetails[]) => void;
}

export default function BulkActionsBar({ 
  selectedFines, 
  onClearSelection,
  onShowPaymentModal 
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkDeleteFines = useMutation({
    mutationFn: async () => {
      const fineIds = selectedFines.map(f => f.id);
      return await apiRequest('POST', '/api/admin/bulk-delete-fines', { fineIds });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Delete Completed",
        description: `Successfully deleted ${data.count} fines`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/fines/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unpaid-fines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/team'] });
      
      onClearSelection();
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Fines",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (selectedFines.length === 0) return null;

  const unpaidFines = selectedFines.filter(f => !f.isPaid);
  const totalAmount = selectedFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-4 mx-4 max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-600">
              {selectedFines.length} selected
            </Badge>
            <div className="text-sm text-slate-600">
              Total: {formatCurrency(totalAmount)}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {unpaidFines.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowPaymentModal(unpaidFines)}
                className="text-green-600 hover:bg-green-50 px-2 py-1"
                title={`Record payment for ${unpaidFines.length} unpaid fine${unpaidFines.length !== 1 ? 's' : ''}`}
              >
                <CreditCard className="w-4 h-4" />
                Pay ({unpaidFines.length})
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:bg-red-50 px-2 py-1"
              title={`Delete ${selectedFines.length} selected fine${selectedFines.length !== 1 ? 's' : ''}`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="px-2 py-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Bulk Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFines.length} selected fine{selectedFines.length !== 1 ? 's' : ''}?
              
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">This will permanently delete:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• {selectedFines.length} fine record{selectedFines.length !== 1 ? 's' : ''}</li>
                    <li>• Total value: {formatCurrency(totalAmount)}</li>
                    {unpaidFines.length > 0 && (
                      <li>• {unpaidFines.length} unpaid fine{unpaidFines.length !== 1 ? 's' : ''} (outstanding money will be lost)</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 mt-2">
                This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteFines.mutate()}
              disabled={bulkDeleteFines.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteFines.isPending ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}