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

  const { data: shareData, isLoading } = useQuery<ShareLinkData>({
    queryKey: ["/api/admin/share-link"],
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
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Invitations</h3>
            <p className="text-sm text-slate-600">Share your team with new players</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-16 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : shareData ? (
            <div className="space-y-4">
              {/* Team Code - Prominent Display */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Team Code</h4>
                    <code className="text-2xl font-bold text-primary font-mono">
                      {shareData.inviteCode}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Invite Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Link className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Shareable Link</span>
                </div>
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
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600">Failed to load team information</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}