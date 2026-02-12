import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HelpCircle, Gavel } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLocation } from "wouter";
import type { User as UserType } from "@shared/schema";
import { getDisplayName } from "@/lib/userUtils";
import { useTeam } from "@/contexts/TeamContext";
import logoUrl from "@assets/foulpay-logo.png";

interface TopBarProps {
  user: UserType | null;
  currentView: 'player' | 'admin';
  pageTitle: string;
  onViewChange?: (view: 'player' | 'admin') => void;
  canSwitchView?: boolean;
}

export default function TopBar({ user, currentView, pageTitle, onViewChange, canSwitchView }: TopBarProps) {
  const [, setLocation] = useLocation();
  const { switchView, canSwitchView: teamCanSwitchView } = useTeam();
  
  const effectiveCanSwitchView = canSwitchView ?? teamCanSwitchView;

  const showGavel = currentView === 'admin';

  const getInitials = (user: UserType | null) => {
    if (!user) return "?";
    const name = getDisplayName(user);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewSwitch = async (view: 'player' | 'admin') => {
    await switchView(view);
    if (onViewChange) {
      onViewChange(view);
    }
    setLocation(view === 'player' ? '/player/home' : '/admin/home');
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 py-2">
          {/* First Row: Logo and Icon Controls */}
          <div className="flex items-center justify-between mb-2">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src={logoUrl} 
                alt="FoulPay Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>

            {/* Right Icons - evenly distributed to align above the profile switcher */}
            <div className="flex items-center justify-between flex-shrink-0" style={{ width: '160px' }}>
              {showGavel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/admin/fines")}
                  className="h-8 w-8 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  aria-label="Issue a fine"
                  data-testid="top-bar-gavel-button"
                >
                  <Gavel className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              )}
              {!showGavel && <div className="h-8 w-8" />}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/help')}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                data-testid="button-help"
                aria-label="Help and support"
              >
                <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Button>

              <ThemeToggle />

              <button
                onClick={() => setLocation('/profile')}
                className="rounded-full hover:ring-2 ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="button-profile-avatar"
                aria-label="User profile"
              >
                <Avatar className="h-8 w-8 shadow-md ring-1 ring-slate-200 dark:ring-slate-600">
                  {user?.profileImageUrl && (
                    <AvatarImage 
                      src={user.profileImageUrl} 
                      alt={getDisplayName(user)}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>

          {/* Second Row: Page Title and View Switcher */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate flex-1 min-w-0 mr-3">
              {pageTitle}
            </h1>

            {effectiveCanSwitchView ? (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex-shrink-0" style={{ width: '160px' }}>
                <button
                  onClick={() => handleViewSwitch('player')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors text-center ${
                    currentView === 'player' 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  data-testid="view-switcher-player"
                >
                  Player
                </button>
                <button
                  onClick={() => handleViewSwitch('admin')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors text-center ${
                    currentView === 'admin' 
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  data-testid="view-switcher-admin"
                >
                  Admin
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg py-1 flex-shrink-0" style={{ width: '160px' }}>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                  {currentView}
                </span>
                <div 
                  className={`h-2 w-2 rounded-full ${
                    currentView === 'player' 
                      ? 'bg-blue-500' 
                      : 'bg-amber-500'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
