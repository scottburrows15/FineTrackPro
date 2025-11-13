import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import InlineFineIssuer from "@/components/inline-fine-issuer";

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
        {/* Inline Fine Issuer - No More Popups! */}
        <InlineFineIssuer />
      </div>
    </AppLayout>
  );
}
