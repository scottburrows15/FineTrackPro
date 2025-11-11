import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Mail, 
  MessageSquare, 
  QrCode,
  Check,
  Share2,
  Download
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareLinkData {
  shareUrl: string;
  inviteCode: string;
  teamName: string;
}

export default function AdminShareLink() {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const { data: shareData, isLoading } = useQuery<ShareLinkData>({
    queryKey: ["/api/admin/share-link"],
  });

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyQrImage = async () => {
    try {
      if (shareData) {
        await navigator.clipboard.writeText(shareData.shareUrl);
        toast({
          title: "QR Code Ready!",
          description: "Invite link copied to clipboard",
        });
      }
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="flex gap-1">
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
        Failed to load
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Team Code */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
          <code className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {shareData.inviteCode}
          </code>
          <Button
            onClick={() => handleCopy(shareData.inviteCode, "Team Code")}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-white dark:hover:bg-slate-700"
          >
            {copiedType === "Team Code" ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-blue-500" />
            )}
          </Button>
        </div>

        {/* Share Options - Colorful Icons */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
          <Button
            onClick={() => handleCopy(shareData.shareUrl, "Invite Link")}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-slate-700"
            title="Copy invite link"
          >
            {copiedType === "Invite Link" ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Share2 className="w-4 h-4 text-blue-600" />
            )}
          </Button>

          <Button
            onClick={() => window.open(`mailto:?subject=Join ${shareData.teamName} on FoulPay&body=Join our team on FoulPay. Team code: ${shareData.inviteCode} or link: ${shareData.shareUrl}`, "_blank")}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-slate-700"
            title="Share via email"
          >
            <Mail className="w-4 h-4 text-red-500" />
          </Button>

          <Button
            onClick={() => window.open(`sms:?body=Join ${shareData.teamName} on FoulPay. Team code: ${shareData.inviteCode} or link: ${shareData.shareUrl}`, "_blank")}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-slate-700"
            title="Share via SMS"
          >
            <MessageSquare className="w-4 h-4 text-green-500" />
          </Button>

          <Button
            onClick={() => setShowQrModal(true)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-slate-700"
            title="Show QR code"
          >
            <QrCode className="w-4 h-4 text-purple-500" />
          </Button>
        </div>
      </div>

      {/* Ultra Compact QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-xs rounded-xl p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-500" />
              QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* QR Code Display - No Card */}
            <div className="w-48 h-48 mx-auto bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded flex items-center justify-center mx-auto mb-2">
                  <QrCode className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Scan to join</p>
              </div>
            </div>

            {/* Team Info */}
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {shareData.teamName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: {shareData.inviteCode}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopyQrImage}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                <Copy className="w-3 h-3 mr-1 text-blue-500" />
                Copy
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = shareData.shareUrl;
                  link.download = `foulpay-invite-${shareData.teamName}.png`;
                  link.click();
                  toast({
                    title: "QR Code Downloaded",
                    description: "QR code saved to your device",
                  });
                }}
                size="sm"
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}