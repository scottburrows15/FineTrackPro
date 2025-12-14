import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { BarChart3 } from "lucide-react";

export default function AdminAnalytics() {
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
      pageTitle="Analytics"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">Team Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            View comprehensive team performance metrics and insights
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </AppLayout>
  );
}
