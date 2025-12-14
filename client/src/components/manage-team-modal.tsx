import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { UK_SPORTS } from "@/lib/sportPositions";
import { Users, Edit, Trash2, Crown, UserCog, Save, Settings, UserPlus } from "lucide-react";
import type { User, Team } from "@shared/schema";

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageTeamModal({ isOpen, onClose }: ManageTeamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    sport: "",
  });

  // Fetch team info
  const { data: teamInfo, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
    enabled: isOpen,
  });

  // Initialize form when team data loads
  useEffect(() => {
    if (teamInfo && !editingTeam) {
      setTeamForm({
        name: teamInfo.name,
        sport: teamInfo.sport,
      });
    }
  }, [teamInfo, editingTeam]);

  // Update team mutation
  const updateTeam = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/team", data);
    },
    onSuccess: () => {
      toast({
        title: "Team Updated",
        description: "Team details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team/info"] });
      setEditingTeam(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    },
  });

  // Remove player mutation
  const removePlayer = useMutation({
    mutationFn: async (playerId: string) => {
      return await apiRequest("DELETE", `/api/admin/players/${playerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Player Removed",
        description: "Player has been removed from the team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove player",
        variant: "destructive",
      });
    },
  });

  // Toggle admin role mutation
  const toggleAdminRole = useMutation({
    mutationFn: async ({ playerId, newRole }: { playerId: string; newRole: string }) => {
      return await apiRequest("PATCH", `/api/admin/players/${playerId}/role`, { role: newRole });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Player role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a team name.",
        variant: "destructive",
      });
      return;
    }
    updateTeam.mutate(teamForm);
  };

  const handleRemovePlayer = (playerId: string, playerName: string) => {
    if (confirm(`Are you sure you want to remove ${playerName} from the team?`)) {
      removePlayer.mutate(playerId);
    }
  };

  const handleToggleRole = (playerId: string, currentRole: string, playerName: string) => {
    const newRole = currentRole === 'admin' ? 'player' : 'admin';
    const action = newRole === 'admin' ? 'promote' : 'demote';
    
    if (confirm(`Are you sure you want to ${action} ${playerName} ${newRole === 'admin' ? 'to admin' : 'to player'}?`)) {
      toggleAdminRole.mutate({ playerId, newRole });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6 bg-white dark:bg-slate-800 border-border">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Team Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-3 sm:space-y-6">
          {/* Team Details Section */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center space-x-2 min-w-0">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Team Details</span>
                </h3>
                <Button
                  onClick={() => {
                    if (editingTeam) {
                      setTeamForm({
                        name: teamInfo?.name || "",
                        sport: teamInfo?.sport || "",
                      });
                    }
                    setEditingTeam(!editingTeam);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  {editingTeam ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {editingTeam ? (
                <form onSubmit={handleUpdateTeam} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label htmlFor="teamName" className="text-sm">Team Name</Label>
                      <Input
                        id="teamName"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter team name"
                        className="mt-1 h-9 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamSport" className="text-sm">Sport</Label>
                      <Select
                        value={teamForm.sport}
                        onValueChange={(value) => setTeamForm(prev => ({ ...prev, sport: value }))}
                      >
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {UK_SPORTS.map((sport) => (
                            <SelectItem key={sport} value={sport} className="text-sm">
                              {sport}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button type="submit" size="sm" disabled={updateTeam.isPending} className="w-full sm:w-auto text-xs sm:text-sm">
                      {updateTeam.isPending ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      )}
                      {updateTeam.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Team Name:</span>
                    <p className="text-sm sm:text-base font-semibold text-slate-900 mt-1">{teamInfo?.name}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Sport:</span>
                    <p className="text-sm sm:text-base text-slate-900 mt-1">{teamInfo?.sport}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Invite Code:</span>
                    <div className="mt-1">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm font-mono">
                        {teamInfo?.inviteCode}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members Section */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center space-x-2 min-w-0">
                  <UserCog className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Team Members ({teamMembers.length})</span>
                </h3>
                <Button
                  onClick={() => {
                    // Copy invite code to clipboard
                    navigator.clipboard.writeText(teamInfo?.inviteCode || '').then(() => {
                      toast({
                        title: "Invite Code Copied",
                        description: "Share this code with players to join your team.",
                      });
                    }).catch(() => {
                      toast({
                        title: "Copy Failed",
                        description: `Invite code: ${teamInfo?.inviteCode}`,
                      });
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>

              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-slate-600 mt-2">Loading team members...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No team members yet.</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-50 rounded-lg space-y-3 sm:space-y-0">
                      {/* Member Info - Full width on mobile */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                          <AvatarImage 
                            src={member.profileImageUrl || undefined} 
                            className="object-cover"
                          />
                          <AvatarFallback className="text-xs sm:text-sm">
                            {getDisplayName(member).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-medium text-slate-900 text-sm sm:text-base truncate">
                              {getDisplayName(member)}
                            </span>
                            {member.role === 'admin' && (
                              <Badge variant="secondary" className="flex items-center space-x-1 flex-shrink-0">
                                <Crown className="w-2 h-2 sm:w-3 sm:h-3" />
                                <span className="text-xs">Admin</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">
                            {member.email} {member.position && `• ${member.position}`}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons - Stacked on mobile */}
                      <div className="flex items-center gap-2 sm:space-x-2 flex-shrink-0">
                        <Button
                          onClick={() => handleToggleRole(member.id, member.role, getDisplayName(member))}
                          variant="outline"
                          size="sm"
                          disabled={toggleAdminRole.isPending}
                          className="text-xs sm:text-sm h-8 px-2 sm:px-3 flex-1 sm:flex-initial"
                        >
                          {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                        <Button
                          onClick={() => handleRemovePlayer(member.id, getDisplayName(member))}
                          variant="outline"
                          size="sm"
                          disabled={removePlayer.isPending}
                          className="text-red-600 hover:text-red-700 h-8 px-2 sm:px-3"
                          title="Remove Player"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}