import { useState } from "react";
import { ChevronUp, ChevronDown, Users, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/contexts/TeamContext";

export function TeamDropup() {
  const { 
    teams, 
    activeTeam, 
    activeView, 
    switchTeam, 
    isLoading
  } = useTeam();
  const [open, setOpen] = useState(false);

  if (isLoading || !activeTeam) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  const handleTeamSelect = async (teamId: string) => {
    await switchTeam(teamId);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 h-auto w-full justify-between"
          data-testid="team-switcher-trigger"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              {activeView === "admin" ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium truncate">{activeTeam.team.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{activeView} View</div>
            </div>
          </div>
          {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronUp className="h-4 w-4 shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side="top" 
        className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
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
                {membership.teamId === activeTeam.teamId && (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
