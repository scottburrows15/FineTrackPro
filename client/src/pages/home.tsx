import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/ui/app-layout";
import PlayerDashboard from "@/components/player-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import TeamOnboarding from "@/components/team-onboarding";
import type { Notification } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'player' | 'admin'>('player');
  const [activeSection, setActiveSection] = useState<string>('home');

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !user.teamId) {
    return <TeamOnboarding />;
  }

  const canSwitchView = user && user.role === 'admin';

  // Determine page title based on active section and view
  const getPageTitle = () => {
    if (currentView === 'player') {
      switch (activeSection) {
        case 'fines': return 'My Fines';
        case 'stats': return 'My Stats';
        case 'notifications': return 'Notifications';
        case 'settings': return 'Settings';
        default: return 'Dashboard';
      }
    } else {
      switch (activeSection) {
        case 'issue-fines': return 'Issue Fines';
        case 'analytics': return 'Team Analytics';
        case 'notifications': return 'Notifications';
        case 'team-settings': return 'Team Settings';
        default: return 'Admin Dashboard';
      }
    }
  };

  // Handle navigation from bottom nav
  const handleNavigation = (section: string) => {
    setActiveSection(section);
    
    // Handle view switching for admins
    if (canSwitchView) {
      // Admin-specific sections should switch to admin view
      if (['issue-fines', 'analytics', 'team-settings'].includes(section)) {
        setCurrentView('admin');
      }
      // Player-specific sections should switch to player view
      else if (['fines', 'stats'].includes(section)) {
        setCurrentView('player');
      }
    }
    
    // Trigger any section-specific actions
    // These will be handled by the dashboard components based on activeSection prop
  };

  return (
    <AppLayout
      user={user}
      currentView={currentView}
      pageTitle={getPageTitle()}
      unreadNotifications={unreadCount}
      onNavigate={handleNavigation}
      activeSection={activeSection}
    >
      {currentView === 'player' ? (
        <PlayerDashboard activeSection={activeSection} />
      ) : (
        <AdminDashboard activeSection={activeSection} />
      )}
    </AppLayout>
  );
}
