import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import PlayerDashboard from "@/components/player-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

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
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation 
          user={user || null} 
          currentView={currentView}
          onViewChange={setCurrentView}
          canSwitchView={false}
        />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to TeamFines Pro</h1>
          <p className="text-slate-600 mb-8">You need to join a team to get started.</p>
          <p className="text-sm text-slate-500">
            Ask your team admin for an invite link to join your team.
          </p>
        </div>
      </div>
    );
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
