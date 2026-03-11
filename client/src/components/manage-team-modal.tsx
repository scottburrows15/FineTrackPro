import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UK_SPORTS } from "@/lib/sportPositions";
import { Edit2, Trash2, Crown, UserPlus, Search, Settings, ShieldCheck, X, Loader2 } from "lucide-react";
import type { User, Team } from "@shared/schema";
import AddPlayerModal from "@/components/add-player-modal";
import EditPlayerModal from "@/components/edit-player-modal"; 
import { cn } from "@/lib/utils";

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageTeamModal({ isOpen, onClose }: ManageTeamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTeam, setEditingTeam] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamForm, setTeamForm] = useState({ name: "", sport: "" });

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (teamInfo && !editingTeam) {
      setTeamForm({ name: teamInfo.name, sport: teamInfo.sport });
    }
  }, [teamInfo, editingTeam]);

  const processedMembers = useMemo(() => {
    return [...teamMembers]
      .filter((m) => {
        const searchStr = `${m.firstName} ${m.lastName} ${m.nickname || ""}`.toLowerCase();
        return searchStr.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return (a.lastName || "").localeCompare(b.lastName || "");
      });
  }, [teamMembers, searchQuery]);

  const getInitials = (user: User) => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "??";
  };

  const removePlayer = useMutation({
    mutationFn: async (playerId: string) => await apiRequest("DELETE", `/api/admin/players/${playerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
    },
  });

  const toggleAdminRole = useMutation({
    mutationFn: async ({ playerId, newRole }: { playerId: string; newRole: string }) => 
      await apiRequest("PATCH", `/api/admin/players/${playerId}/role`, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
    },
  });

  const saveTeamSettings = useMutation({
    mutationFn: async (data: { name: string; sport: string }) => 
      await apiRequest("PATCH", "/api/team", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setEditingTeam(false);
      toast({
        title: "Settings saved",
        description: "Team settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save team settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const hasChanges = editingTeam && teamInfo && (
    teamForm.name !== teamInfo.name || teamForm.sport !== teamInfo.sport
  );

  const handleSaveOrCancel = () => {
    if (hasChanges) {
      saveTeamSettings.mutate(teamForm);
    } else {
      setEditingTeam(!editingTeam);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] w-[94vw] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white dark:bg-card flex flex-col max-h-[85vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-slate-50 dark:bg-background p-5 border-b border-slate-100 dark:border-border">
          <div className="flex items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <DialogTitle className="text-lg font-black tracking-tight leading-none truncate text-slate-900 dark:text-white">Club Identity</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                  Settings & Roster
                </DialogDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className={cn(
                "rounded-lg h-8 px-2 font-bold text-[10px] uppercase tracking-wider shrink-0",
                hasChanges 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "text-blue-600 hover:bg-blue-100/50"
              )}
              onClick={handleSaveOrCancel}
              disabled={saveTeamSettings.isPending}
            >
              {saveTeamSettings.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : hasChanges ? (
                <Edit2 className="w-3 h-3 mr-1" />
              ) : editingTeam ? (
                <X className="w-3 h-3 mr-1" />
              ) : (
                <Edit2 className="w-3 h-3 mr-1" />
              )}
              {hasChanges ? "Save" : editingTeam ? "Cancel" : "Edit"}
            </Button>
          </div>

          {!editingTeam ? (
            <div className="mt-4 flex gap-4 items-center justify-between bg-white dark:bg-card p-3 rounded-2xl border border-slate-100 dark:border-border shadow-sm">
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Active Club</p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{teamInfo?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Invite Code</p>
                <code className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                  {teamInfo?.inviteCode}
                </code>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 text-left">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Club Name</Label>
                  <Input 
                    className="h-9 bg-white dark:bg-card border-none rounded-lg font-bold text-sm shadow-sm"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sport</Label>
                  <Select value={teamForm.sport} onValueChange={(v) => setTeamForm(p => ({ ...p, sport: v }))}>
                    <SelectTrigger className="h-9 bg-white dark:bg-card border-none rounded-lg font-bold text-xs shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UK_SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- ROSTER --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-card">
          <div className="px-5 pt-4 pb-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Squad Roster ({teamMembers.length})
              </h3>
              <Button 
                size="sm" 
                onClick={() => setShowAddPlayerModal(true)}
                className="h-7 bg-blue-600 text-white hover:bg-blue-700 font-bold text-[9px] uppercase tracking-wider rounded-lg px-3"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <Input 
                placeholder="Search players..."
                className="h-9 pl-9 bg-slate-50 dark:bg-muted border-none rounded-xl text-xs font-medium placeholder:text-slate-400 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
            {membersLoading ? (
               <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /></div>
            ) : processedMembers.map((member) => (
              <div 
                key={member.id} 
                className={cn(
                  "group relative flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-muted/50 rounded-xl border border-transparent hover:border-blue-100 transition-all overflow-hidden",
                  member.role === 'admin' ? "pl-5" : "pl-3"
                )}
              >
                {/* WIDER VERTICAL ADMIN STRIP */}
                {member.role === 'admin' && (
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-amber-400 flex items-center justify-center">
                    <span className="rotate-180 text-[7px] font-black uppercase text-amber-900/40 tracking-[0.2em] [writing-mode:vertical-lr]">
                      ADMIN
                    </span>
                  </div>
                )}

                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 rounded-lg overflow-hidden border-2 border-white dark:border-border shadow-sm">
                    <AvatarImage 
                      src={member.profileImageUrl || undefined} 
                      className="object-cover w-full h-full aspect-square" 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-black text-xs rounded-none">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  {member.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white dark:border-border shadow-sm">
                      <Crown className="w-2.5 h-2.5 text-amber-900" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate block leading-tight">
                    {member.firstName} {member.lastName}
                  </span>
                  <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                    {member.nickname ? `"${member.nickname}"` : member.position || "Member"}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600" onClick={() => setSelectedPlayer(member)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-400" 
                    onClick={() => toggleAdminRole.mutate({ 
                      playerId: member.id, 
                      newRole: member.role === 'admin' ? 'player' : 'admin' 
                    })}
                  >
                    <ShieldCheck className={cn("w-4 h-4", member.role === 'admin' && "text-blue-600")} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600"
                    onClick={() => {
                      if(confirm(`Remove ${member.firstName}?`)) removePlayer.mutate(member.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
      
      <AddPlayerModal isOpen={showAddPlayerModal} onClose={() => setShowAddPlayerModal(false)} />
      {selectedPlayer && (
        <EditPlayerModal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} player={selectedPlayer} />
      )}
    </Dialog>
  );
}
