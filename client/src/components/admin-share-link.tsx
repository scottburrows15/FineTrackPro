import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users2 } from "lucide-react";

interface ShareLinkData {
  shareUrl: string;
  inviteCode: string;
  teamName: string;
}

export default function AdminShareLink() {
  const { toast } = useToast();

  const { data: shareData, isLoading } = useQuery<ShareLinkData>({
    queryKey: ["/api/admin/share-link"],
  });

  const handleCopyShareLink = async () => {
    if (shareData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(shareData.shareUrl);
        toast({
          title: "Link Copied!",
          description: "Share this link with new players to join your team.",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="text-sm text-slate-500">Failed to load invite link</div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full" data-testid="admin-share-section">
      {/* Team Code Badge */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2" data-testid="team-code-badge">
        <Users2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Team Code</span>
          <code className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono tracking-wider" data-testid="text-team-code">
            {shareData.inviteCode}
          </code>
        </div>
      </div>

      {/* Copy Link Button */}
      <Button
        onClick={handleCopyShareLink}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
        data-testid="button-copy-invite-link"
      >
        <Copy className="w-3.5 h-3.5 mr-1.5" />
        Copy Invite Link
      </Button>
    </div>
  );
}