import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/ui/top-bar";
import BottomNav from "@/components/ui/bottom-nav";
import { useTeam } from "@/contexts/TeamContext";
import type { User as UserType } from "@shared/schema";

interface AppLayoutProps {
  user: UserType | null;
  currentView?: 'player' | 'admin'; // Now optional, will use TeamContext by default
  pageTitle: string;
  unreadNotifications?: number;
  onViewChange?: (view: 'player' | 'admin') => void; // Now optional
  canSwitchView?: boolean; // Now optional
  children: ReactNode;
}

interface NotificationCounts {
  player: {
    total: number;
    unread: number;
  };
  admin: {
    total: number;
    unread: number;
  };
}

export default function AppLayout({
  user,
  currentView: propCurrentView,
  pageTitle,
  unreadNotifications,
  onViewChange,
  canSwitchView: propCanSwitchView,
  children,
}: AppLayoutProps) {
  const { activeView, canSwitchView: teamCanSwitchView } = useTeam();
  
  // Use the prop currentView as the source of truth when provided (page knows which view it is),
  // then fall back to TeamContext.activeView for the stored preference
  const currentView = propCurrentView || activeView || 'player';
  const canSwitchView = propCanSwitchView ?? teamCanSwitchView;

  // Fetch independent notification counts for player and admin views
  const { data: notificationCounts } = useQuery<NotificationCounts>({
    queryKey: ["/api/notifications/counts"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Determine which unread count to display based on current view
  const unreadCount = notificationCounts 
    ? (currentView === 'player' ? notificationCounts.player.unread : notificationCounts.admin.unread)
    : (unreadNotifications || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Top Bar - Fixed at top */}
      <TopBar 
        user={user} 
        currentView={currentView} 
        pageTitle={pageTitle}
        onViewChange={onViewChange}
        canSwitchView={canSwitchView}
      />

      {/* Main Content - With padding for fixed top and bottom bars */}
      <main className="pt-[88px] pb-[72px] sm:pb-[80px]">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <BottomNav
        currentView={currentView}
        unreadCount={unreadCount}
      />
    </div>
  );
}
