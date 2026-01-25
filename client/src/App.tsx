import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { TeamProvider } from "@/contexts/TeamContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import JoinTeam from "@/pages/join-team";
import Payment from "@/pages/payment";
import Payments from "@/pages/payments";
import PaymentConfirmed from "@/pages/payment-confirmed";
import NotFound from "@/pages/not-found";

// Player pages
import PlayerHome from "@/pages/player/home";
import PlayerFines from "@/pages/player/fines";
import PlayerStats from "@/pages/player/stats";
import PlayerNotifications from "@/pages/player/notifications";
import PlayerSettings from "@/pages/player/settings";

// Admin pages
import AdminHome from "@/pages/admin/home";
import AdminFines from "@/pages/admin/fines";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminNotifications from "@/pages/admin/notifications";
import AdminSettings from "@/pages/admin/settings";

// Shared pages
import Help from "@/pages/help";
import Profile from "@/pages/profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading or unauthenticated routes
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/join/:inviteCode" component={JoinTeam} />
        {/* Payment confirmed needs to be accessible during loading state since session may take time to restore after GoCardless redirect */}
        <Route path="/payment-confirmed" component={PaymentConfirmed} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <Switch>
      {/* Legacy home route - keep for backward compatibility */}
      <Route path="/" component={Home} />
      
      {/* Player routes */}
      <Route path="/player/home" component={PlayerHome} />
      <Route path="/player/fines" component={PlayerFines} />
      <Route path="/player/stats" component={PlayerStats} />
      <Route path="/player/notifications" component={PlayerNotifications} />
      <Route path="/player/settings" component={PlayerSettings} />
      
      {/* Admin routes */}
      <Route path="/admin/home" component={AdminHome} />
      <Route path="/admin/fines" component={AdminFines} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/settings" component={AdminSettings} />
      
      {/* Shared routes */}
      <Route path="/help" component={Help} />
      <Route path="/profile" component={Profile} />
      <Route path="/payment" component={Payment} />
      <Route path="/payments" component={Payments} />
      <Route path="/payment-confirmed" component={PaymentConfirmed} />
      <Route path="/player/pay" component={Payment} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TeamProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <InstallPrompt />
          </TooltipProvider>
        </TeamProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
