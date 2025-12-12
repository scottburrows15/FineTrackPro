import { createContext, useContext, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TeamMembershipWithTeam } from "@shared/schema";

interface TeamContextType {
  teams: TeamMembershipWithTeam[];
  activeTeam: TeamMembershipWithTeam | null;
  activeTeamId: string | null;
  activeView: "player" | "admin";
  isLoading: boolean;
  switchTeam: (teamId: string, view?: "player" | "admin") => Promise<void>;
  switchView: (view: "player" | "admin") => Promise<void>;
  refetchTeams: () => void;
  hasMultipleTeams: boolean;
  canSwitchView: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading: teamsLoading, refetch: refetchTeams } = useQuery<TeamMembershipWithTeam[]>({
    queryKey: ["/api/user/teams"],
  });

  const { data: activeMembership, isLoading: activeLoading } = useQuery<TeamMembershipWithTeam>({
    queryKey: ["/api/user/active-team"],
  });

  const switchTeamMutation = useMutation({
    mutationFn: async ({ teamId, activeView }: { teamId: string; activeView?: string }) => {
      const res = await apiRequest("PUT", "/api/user/active-team", { teamId, activeView });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/active-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
  });

  const switchTeam = useCallback(async (teamId: string, view?: "player" | "admin") => {
    await switchTeamMutation.mutateAsync({ teamId, activeView: view });
  }, [switchTeamMutation]);

  const switchView = useCallback(async (view: "player" | "admin") => {
    if (!activeMembership) return;
    await switchTeamMutation.mutateAsync({ 
      teamId: activeMembership.teamId, 
      activeView: view 
    });
  }, [activeMembership, switchTeamMutation]);

  const value = useMemo(() => {
    const activeTeam = activeMembership || null;
    const activeTeamId = activeTeam?.teamId || null;
    const activeView = (activeTeam?.activeView as "player" | "admin") || "player";
    const canSwitchView = activeTeam?.role === "admin" || activeTeam?.role === "both";

    return {
      teams,
      activeTeam,
      activeTeamId,
      activeView,
      isLoading: teamsLoading || activeLoading,
      switchTeam,
      switchView,
      refetchTeams: () => refetchTeams(),
      hasMultipleTeams: teams.length > 1,
      canSwitchView,
    };
  }, [teams, activeMembership, teamsLoading, activeLoading, switchTeam, switchView, refetchTeams]);

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
