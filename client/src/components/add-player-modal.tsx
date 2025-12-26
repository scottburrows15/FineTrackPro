import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getPositionsForSport } from "@/lib/sportPositions";
import { UserPlus, Save, Mail, Loader2 } from "lucide-react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TeamInfo {
  id: string;
  name: string;
  sport: string;
}

export default function AddPlayerModal({ isOpen, onClose }: AddPlayerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: teamInfo } = useQuery<TeamInfo>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    nickname: "",
  });

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", position: "", nickname: "" });
  };

  const addPlayer = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/add-player", data),
    onSuccess: () => {
      toast({ title: "Success", description: `${formData.firstName} added.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    addPlayer.mutate(formData);
  };

  const sportPositions = teamInfo?.sport ? getPositionsForSport(teamInfo.sport) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] w-[92vw] p-0 overflow-hidden border-none shadow-2xl rounded-[24px] bg-white dark:bg-slate-900">
        
        {/* --- TIGHT HEADER --- */}
        <div className="pt-5 px-6 pb-3 flex items-center gap-3 border-b border-slate-50 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg font-black tracking-tight leading-none">
              New Player
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
              {teamInfo?.name || 'Squad Entry'}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* NAME ROW */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">First Name</Label>
              <Input
                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm"
                value={formData.firstName}
                onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Last Name</Label>
              <Input
                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm"
                value={formData.lastName}
                onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* EMAIL (OPTIONAL) */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex justify-between">
              Email <span className="opacity-50 font-medium lowercase">optional</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
              <Input
                type="email"
                className="h-10 pl-9 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="player@example.com"
              />
            </div>
          </div>

          {/* ROLE ROW */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nickname</Label>
              <Input
                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm"
                value={formData.nickname}
                onChange={(e) => setFormData(p => ({ ...p, nickname: e.target.value }))}
                placeholder="The Wall"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Position</Label>
              <Select value={formData.position} onValueChange={(v) => setFormData(p => ({ ...p, position: v }))}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sportPositions.map((p) => (
                    <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* COMPACT ACTIONS */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-11 font-bold text-slate-400 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPlayer.isPending}
              className="flex-[2] h-11 font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 dark:shadow-none uppercase tracking-widest text-[11px]"
            >
              {addPlayer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Player"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
