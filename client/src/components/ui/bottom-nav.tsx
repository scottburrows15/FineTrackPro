import { useState } from "react";
import { BarChart3, Home, Bell, Users, ChevronUp, Check, Settings, PlusCircle, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTeam } from "@/contexts/TeamContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface BottomNavProps {
  currentView: 'player' | 'admin';
  unreadCount: number;
}

export default function BottomNav({ currentView, unreadCount }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const { teams, activeTeam, switchTeam, isLoading } = useTeam();
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);

  const { data: teamInfo } = useQuery<{ paymentMode?: string }>({
    queryKey: ["/api/team/info"],
    enabled: currentView === 'player',
  });

  const isWalletMode = teamInfo?.paymentMode === 'wallet';

  const playerItems = [
    { id: 'notifications', path: '/player/notifications', icon: Bell, label: 'Alerts', color: 'text-purple-500', badge: unreadCount },
    { id: 'home', path: '/player/home', icon: Home, label: 'Home', color: 'text-blue-500' },
    ...(isWalletMode ? [{ id: 'wallet', path: '/player/wallet', icon: Wallet, label: 'Wallet', color: 'text-emerald-500', badge: 0 }] : []),
    { id: 'settings', path: '/player/settings', icon: Settings, label: 'Settings', color: 'text-slate-500' },
  ];

  const navItems = currentView === 'player' 
    ? playerItems
    : [
        { id: 'notifications', path: '/admin/notifications', icon: Bell, label: 'Alerts', color: 'text-purple-500', badge: unreadCount },
        { id: 'analytics', path: '/admin/analytics', icon: BarChart3, label: 'Stats', color: 'text-indigo-500' },
        { id: 'home', path: '/admin/home', icon: Home, label: 'Dashboard', color: 'text-blue-500' },
        { id: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings', color: 'text-slate-500' },
      ];

  const handleTeamSelect = async (teamId: string) => {
    await switchTeam(teamId);
    setTeamMenuOpen(false);
  };

  const getTeamDisplayName = () => {
    if (isLoading || !activeTeam) return "Team";
    const name = activeTeam.team.name;
    return name.length > 6 ? name.substring(0, 6) + "…" : name;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-slate-200 dark:border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const showBadge = item.id === 'notifications' && (item.badge ?? 0) > 0;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200 min-w-[60px] sm:min-w-[70px] relative
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-primary/10' 
                    : 'hover:bg-slate-100 dark:hover:bg-muted'
                  }
                `}
                data-testid={`bottom-nav-${item.id}`}
              >
                <div className="relative">
                  <Icon 
                    className={`
                      h-5 w-5 sm:h-6 sm:w-6 transition-colors
                      ${isActive ? item.color : 'text-slate-600 dark:text-muted-foreground'}
                    `}
                  />
                  {showBadge && (
                    <div 
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-card px-1"
                      data-testid={`badge-${item.id}`}
                    >
                      <span className="text-[10px] font-bold text-white leading-none">
                        {(item.badge || 0) > 99 ? '99+' : item.badge}
                      </span>
                    </div>
                  )}
                </div>
                <span 
                  className={`
                    text-[10px] sm:text-xs font-medium transition-colors
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-muted-foreground'
                    }
                  `}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
          
          {/* Team Switcher */}
          <DropdownMenu open={teamMenuOpen} onOpenChange={setTeamMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200 min-w-[60px] sm:min-w-[70px] relative
                  ${teamMenuOpen 
                    ? 'bg-blue-50 dark:bg-primary/10' 
                    : 'hover:bg-slate-100 dark:hover:bg-muted'
                  }
                `}
                data-testid="bottom-nav-team"
              >
                <div className="relative flex items-center">
                  <Users 
                    className={`
                      h-5 w-5 sm:h-6 sm:w-6 transition-colors
                      ${teamMenuOpen ? 'text-amber-500' : 'text-slate-600 dark:text-muted-foreground'}
                    `}
                  />
                  <ChevronUp className={`h-3 w-3 ml-0.5 transition-transform ${teamMenuOpen ? 'rotate-180' : ''} text-slate-400`} />
                </div>
                <span 
                  className={`
                    text-[10px] sm:text-xs font-medium transition-colors truncate max-w-[60px]
                    ${teamMenuOpen 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-muted-foreground'
                    }
                  `}
                >
                  {getTeamDisplayName()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="top" 
              className="w-64 bg-white dark:bg-popover border border-slate-200 dark:border-border mb-2"
              data-testid="team-switcher-menu"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Your Teams
              </div>
              {teams.map((membership) => (
                <DropdownMenuItem
                  key={membership.id}
                  onClick={() => handleTeamSelect(membership.teamId)}
                  data-testid={`switch-team-${membership.teamId}`}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0">
                        <Users className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <span className="truncate block text-sm">{membership.team.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {membership.role === 'both' ? 'Player & Admin' : 
                           membership.role === 'admin' ? 'Admin' : 'Player'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {membership.unreadCount && membership.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                          {membership.unreadCount}
                        </Badge>
                      )}
                      {activeTeam && membership.teamId === activeTeam.teamId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              {teams.length === 0 && (
                <div className="px-2 py-3 text-sm text-center text-muted-foreground">
                  No teams found
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setTeamMenuOpen(false);
                  setLocation('/create-team');
                }}
                className="cursor-pointer"
                data-testid="create-new-team"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                    <PlusCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Create a New Team</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
