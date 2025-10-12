import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import TeamOnboarding from "@/components/team-onboarding";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to appropriate home page based on user role
  useEffect(() => {
    if (user && user.teamId) {
      if (user.role === 'admin') {
        setLocation('/admin/home');
      } else {
        setLocation('/player/home');
      }
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !user.teamId) {
    return <TeamOnboarding />;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
