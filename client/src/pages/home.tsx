import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import TeamOnboarding from "@/components/team-onboarding";
import logoUrl from "@assets/foulpay-logo.png";

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <img 
        src={logoUrl} 
        alt="FoulPay" 
        className="w-48 h-auto mb-6 animate-pulse"
      />
      <div className="animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}

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
    return <SplashScreen />;
  }

  if (!user || !user.teamId) {
    return <TeamOnboarding />;
  }

  // Show loading while redirecting
  return <SplashScreen />;
}
