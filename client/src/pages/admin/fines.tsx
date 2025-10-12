import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import UnifiedFineIssuer from "@/components/unified-fine-issuer";
import { Gavel } from "lucide-react";

export default function AdminFines() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUnifiedFineIssuer, setShowUnifiedFineIssuer] = useState(true);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Issue Fines"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Gavel className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold">Issue Fines</h1>
          </div>
          <p className="text-muted-foreground">
            Issue fines to individual players or multiple players at once
          </p>
        </div>

        {/* Unified Fine Issuer Component */}
        {showUnifiedFineIssuer && (
          <UnifiedFineIssuer 
            isOpen={showUnifiedFineIssuer}
            onClose={() => setShowUnifiedFineIssuer(false)} 
          />
        )}

        {!showUnifiedFineIssuer && (
          <div className="flex justify-center py-8">
            <Button
              onClick={() => setShowUnifiedFineIssuer(true)}
              size="lg"
              data-testid="button-show-fine-issuer"
            >
              <Gavel className="mr-2 h-5 w-5" />
              Open Fine Issuer
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
