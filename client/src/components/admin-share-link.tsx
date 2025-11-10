import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users2, Share2, Mail, Twitter, MessageCircle } from "lucide-react";

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

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${type} Copied!`,
        description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
      });
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
      <div className="flex flex-col gap-1 w-full">
        <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!shareData) {
    return <div className="text-sm text-slate-500">Failed to load invite link</div>;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 w-full flex flex-col gap-2">
      {/* Team Code */}
      <div className="flex items-center gap-2 min-w-0">
        <Users2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <code className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono truncate">
          {shareData.inviteCode}
        </code>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCopy(shareData.inviteCode, "Team Code")}
          className="shrink-0 p-1"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      {/* Share URL inline with bigger icon */}
      <div className="flex items-center gap-2 min-w-0">
        <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <code className="text-sm font-mono text-blue-700 dark:text-blue-300 truncate">
          {shareData.shareUrl}
        </code>
      </div>

      {/* Functional buttons row for share URL */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCopy(shareData.shareUrl, "Invite Link")}
          className="p-1"
        >
          <Copy className="w-4 h-4 text-blue-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`mailto:?body=${shareData.shareUrl}`, "_blank")}
          className="p-1"
        >
          <Mail className="w-4 h-4 text-blue-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            window.open(`https://twitter.com/intent/tweet?url=${shareData.shareUrl}`, "_blank")
          }
          className="p-1"
        >
          <Twitter className="w-4 h-4 text-blue-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`sms:?body=${shareData.shareUrl}`, "_blank")}
          className="p-1"
        >
          <MessageCircle className="w-4 h-4 text-green-600" />
        </Button>
      </div>
    </div>
  );
}