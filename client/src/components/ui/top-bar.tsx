import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, HelpCircle, LogOut, User, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLocation } from "wouter";
import type { User as UserType } from "@shared/schema";
import { getDisplayName } from "@/lib/userUtils";
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleViewSwitch = (view: 'player' | 'admin') => {
    if (onViewChange) {
      onViewChange(view);
      // Navigate to the appropriate home page
      setLocation(view === 'player' ? '/player/home' : '/admin/home');
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 py-3">
          {/* FoulPay Logo and Page Title with View Switcher */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src={logoUrl} 
                  alt="FoulPay Logo" 
                  className="h-5 w-auto sm:h-5 object-contain"
                />
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {pageTitle}
                </h1>
              </div>
              {/* View Switcher - only show if user can switch views */}
              {canSwitchView ? (
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleViewSwitch('player')}
                    className="relative pb-1 transition-colors"
                    data-testid="view-switcher-player"
                  >
                    <span className={`text-sm font-medium ${
                      currentView === 'player' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                      Player View
                    </span>
                    {currentView === 'player' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
                    )}
                  </button>
                  <button
                    onClick={() => handleViewSwitch('admin')}
                    className="relative pb-1 transition-colors"
                    data-testid="view-switcher-admin"
                  >
                    <span className={`text-sm font-medium ${
                      currentView === 'admin' 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                      Admin View
                    </span>
                    {currentView === 'admin' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    {currentView === 'player' ? 'Player View' : 'Admin View'}
                  </span>
                  <div 
                    className={`h-1 w-12 rounded-full ${
                      currentView === 'player' 
                        ? 'bg-blue-500' 
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Right Section: Help, Profile, Menu */}
            <div className="flex items-center gap-4">
              {/* Help Icon */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/help')}
                className="h-4 w-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                data-testid="button-help"
              >
                <HelpCircle className="h-7 w-7 text-slate-600 dark:text-slate-400" />
              </Button>

              {/* Profile Avatar */}
              <button
                onClick={() => setLocation('/profile')}
                className="rounded-full hover:ring-2 ring-blue-500 transition-all"
                data-testid="button-profile-avatar"
              >
                <Avatar className="h-8 w-8 shadow-md ring-2 ring-white dark:ring-slate-700">
                  {user?.profileImageUrl && (
                    <AvatarImage 
                      src={user.profileImageUrl} 
                      alt={getDisplayName(user)}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    data-testid="button-hamburger-menu"
                  >
                    <Menu className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-border">
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    data-testid="menu-profile-settings"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation(currentView === 'player' ? '/player/settings' : '/admin/settings')}
                    data-testid="menu-app-settings"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>App Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-theme-toggle">
                    <div className="flex items-center justify-between w-full">
                      <span>Theme</span>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-slate-500">
                    Version 1.0.0
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
