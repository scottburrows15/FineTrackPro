import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import PlayerDashboard from "@/components/player-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import TeamOnboarding from "@/components/team-onboarding";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'player' | 'admin'>('player');

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation 
        user={user || null} 
        currentView={currentView}
        onViewChange={setCurrentView}
        canSwitchView={canSwitchView}
      />
      
      {currentView === 'player' ? (
        <PlayerDashboard />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}
