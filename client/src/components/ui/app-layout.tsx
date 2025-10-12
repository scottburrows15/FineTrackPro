import { ReactNode } from "react";
import TopBar from "@/components/ui/top-bar";
import BottomNav from "@/components/ui/bottom-nav";
import type { User as UserType } from "@shared/schema";

interface AppLayoutProps {
  user: UserType | null;
  currentView: 'player' | 'admin';
  pageTitle: string;
  unreadNotifications: number;
  onNavigate: (section: string) => void;
  activeSection?: string;
  children: ReactNode;
}

export default function AppLayout({
  user,
  currentView,
  pageTitle,
  unreadNotifications,
  onNavigate,
  activeSection,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Top Bar - Fixed at top */}
      <TopBar 
        user={user} 
        currentView={currentView} 
        pageTitle={pageTitle}
      />

      {/* Main Content - With padding for fixed top and bottom bars */}
      <main className="pt-[88px] pb-[72px] sm:pb-[80px]">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <BottomNav
        currentView={currentView}
        unreadCount={unreadNotifications}
        onNavigate={onNavigate}
        activeSection={activeSection}
      />
    </div>
  );
}
