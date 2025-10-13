import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allNotifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Filter to only show settled fines (paid/deleted) for admins
  const notifications = allNotifications.filter(n => n.type === 'fine_paid' || n.type === 'fine_deleted');

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'fine_issued':
        return '⚠️';
      case 'fine_paid':
        return '✅';
      case 'fine_deleted':
        return '🗑️';
      case 'reminder':
        return '🔔';
      case 'team_update':
        return '📢';
      default:
        return '📋';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="admin"
      pageTitle="Notifications"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={true}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Admin Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <Badge variant={unreadCount > 0 ? "destructive" : "outline"} data-testid="badge-unread-count">
            <Bell className="h-3 w-3 mr-1" />
            {unreadCount}
          </Badge>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellOff className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground">You're all caught up! Check back later.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-all hover:shadow-md cursor-pointer ${
                  !notification.isRead 
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' 
                    : 'bg-white dark:bg-slate-800 opacity-75 hover:opacity-100'
                }`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex gap-3">
                  {/* Profile Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className={`text-sm ${!notification.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                      data-testid={`notification-message-${notification.id}`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Read Indicator */}
                  <div className="flex-shrink-0">
                    {!notification.isRead ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" data-testid={`unread-indicator-${notification.id}`} />
                    ) : (
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State Illustration */}
        {!isLoading && notifications.length === 0 && (
          <div className="mt-8 text-center text-muted-foreground">
            <p className="text-sm">When fines are settled (paid or deleted), notifications will appear here.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
