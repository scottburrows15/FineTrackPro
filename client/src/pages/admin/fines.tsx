import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import InlineFineIssuer from "@/components/inline-fine-issuer";
import { Gavel } from "lucide-react";

export default function AdminFines() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

        {/* Inline Fine Issuer - No More Popups! */}
        <InlineFineIssuer />
      </div>
    </AppLayout>
  );
}
