import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, HelpCircle, LogOut, User, Settings, Shield, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { User as UserType } from "@shared/schema";
import ProfileModal from "@/components/profile-modal";
import { getDisplayName } from "@/lib/userUtils";

interface TopBarProps {
  user: UserType | null;
  currentView: 'player' | 'admin';
  pageTitle: string;
  onViewChange?: (view: 'player' | 'admin') => void;
  canSwitchView?: boolean;
}

export default function TopBar({ user, currentView, pageTitle, onViewChange, canSwitchView }: TopBarProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 py-3">
          {/* Page Title and View Indicator */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {pageTitle}
              </h1>
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
            </div>

            {/* Right Section: Help, Profile, Menu */}
            <div className="flex items-center gap-2">
              {/* Help Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                data-testid="button-help"
              >
                <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Button>

              {/* Profile Avatar */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="h-9 w-9 rounded-full hover:ring-2 ring-blue-500 transition-all"
                data-testid="button-profile-avatar"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
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
                    className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    data-testid="button-hamburger-menu"
                  >
                    <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-border">
                  {canSwitchView && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        View Mode
                      </div>
                      <DropdownMenuItem 
                        onClick={() => handleViewSwitch('player')}
                        className={currentView === 'player' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        data-testid="menu-switch-player-view"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Player View</span>
                        {currentView === 'player' && <span className="ml-auto text-blue-600">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleViewSwitch('admin')}
                        className={currentView === 'admin' ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                        data-testid="menu-switch-admin-view"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin View</span>
                        {currentView === 'admin' && <span className="ml-auto text-amber-600">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setShowProfileModal(true)}
                    data-testid="menu-profile-settings"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-app-settings">
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

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
