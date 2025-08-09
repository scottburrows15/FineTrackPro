import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share, Link, ExternalLink } from "lucide-react";

interface ShareLinkData {
  shareUrl: string;
  inviteCode: string;
  teamName: string;
}

export default function AdminShareLink() {
  const { toast } = useToast();
  const [showShareLink, setShowShareLink] = useState(false);

  const { data: shareData, isLoading } = useQuery<ShareLinkData>({
    queryKey: ["/api/admin/share-link"],
    enabled: showShareLink,
  });

  const handleCopyShareLink = async () => {
    if (shareData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(shareData.shareUrl);
        toast({
          title: "Share Link Copied!",
          description: "The team invitation link has been copied to your clipboard.",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy share link. Please copy it manually.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyCode = async () => {
    if (shareData?.inviteCode) {
      try {
        await navigator.clipboard.writeText(shareData.inviteCode);
        toast({
          title: "Team Code Copied!",
          description: "The team code has been copied to your clipboard.",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy team code. Please copy it manually.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Team Invitations</h3>
              <p className="text-sm text-slate-600">Share your team with new players</p>
            </div>
            <Button 
              onClick={() => setShowShareLink(!showShareLink)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Share className="w-4 h-4" />
              <span>{showShareLink ? 'Hide' : 'Show'} Share Options</span>
            </Button>
          </div>

          {showShareLink && (
            <div className="space-y-4 pt-4 border-t">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-10 bg-slate-200 rounded animate-pulse" />
                  <div className="h-10 bg-slate-200 rounded animate-pulse" />
                </div>
              ) : shareData ? (
                <>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Direct Invitation Link</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Send this link to players - they'll automatically join {shareData.teamName} when they click it
                    </p>
                    <div className="flex space-x-2">
                      <Input
                        value={shareData.shareUrl}
                        readOnly
                        className="font-mono text-sm bg-white"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyShareLink}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-slate-700">Team Code (Manual Entry)</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Players can also manually enter this code in the team join section
                    </p>
                    <div className="flex space-x-2">
                      <Input
                        value={shareData.inviteCode}
                        readOnly
                        className="font-mono text-lg text-center font-bold max-w-32"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCode}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">How to invite players:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Share the direct link via WhatsApp, email, or text message</li>
                      <li>• Give them the team code to enter manually</li>
                      <li>• Both methods will add them to your team automatically</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-600">Failed to load share link</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}