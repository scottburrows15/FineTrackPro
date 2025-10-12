import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IssueFineModal from "./issue-fine-modal";
import BulkFineModal from "./bulk-fine-modal";
import { Gavel, Users, X } from "lucide-react";

interface UnifiedFineIssuerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedFineIssuer({ isOpen, onClose }: UnifiedFineIssuerProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [showIssueFineModal, setShowIssueFineModal] = useState(false);
  const [showBulkFineModal, setShowBulkFineModal] = useState(false);

  if (!isOpen) return null;

  const handleSingleClick = () => {
    setShowIssueFineModal(true);
    onClose();
  };

  const handleBulkClick = () => {
    setShowBulkFineModal(true);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-border" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Issue Fines</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                data-testid="button-close-unified-fine"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Choose how you'd like to issue fines:
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto p-6 flex items-center gap-4 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 transition-all duration-200 border-2"
                onClick={handleSingleClick}
                data-testid="button-single-fine"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Single Fine</h3>
                  <p className="text-sm text-muted-foreground">Issue a fine to one player</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-6 flex items-center gap-4 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20 transition-all duration-200 border-2"
                onClick={handleBulkClick}
                data-testid="button-bulk-fines"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Bulk Fines</h3>
                  <p className="text-sm text-muted-foreground">Issue fines to multiple players at once</p>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showIssueFineModal && (
        <IssueFineModal
          isOpen={showIssueFineModal}
          onClose={() => setShowIssueFineModal(false)}
        />
      )}

      {showBulkFineModal && (
        <BulkFineModal
          isOpen={showBulkFineModal}
          onClose={() => setShowBulkFineModal(false)}
        />
      )}
    </>
  );
}
