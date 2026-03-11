import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPositionsForSport } from "@/lib/sportPositions";
import { UserCog, Mail, User, MapPin, Crown, Save, Camera, Upload, X, Loader2, AtSign } from "lucide-react";
import type { User as UserType, Team } from "@shared/schema";
import { cn } from "@/lib/utils";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: UserType | null;
}

export default function EditPlayerModal({ isOpen, onClose, player }: EditPlayerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: teamInfo } = useQuery<Team>({
    queryKey: ["/api/team/info"],
    enabled: isOpen,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    nickname: "",
    role: "player",
  });

  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        email: player.email || "",
        position: player.position || "",
        nickname: player.nickname || "",
        role: player.role || "player",
      });
      setPreviewImage(player.profileImageUrl || "");
      setSelectedFile(null);
    }
  }, [player]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Limit is 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('playerId', player!.id.toString());
      const response = await fetch('/api/admin/upload-profile-image', { method: 'POST', body: fd });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewImage(data.imageUrl);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      toast({ title: "Success", description: "Profile photo updated." });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async (data: any) => await apiRequest("PATCH", `/api/admin/players/${player?.id}`, data),
    onSuccess: () => {
      toast({ title: "Updated", description: "Profile changes saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      onClose();
    },
  });

  const sportPositions = teamInfo?.sport ? getPositionsForSport(teamInfo.sport) : [];

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] w-[94vw] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white dark:bg-card flex flex-col max-h-[90vh]">

        {/* --- HEADER --- */}
        <div className="bg-slate-50 dark:bg-background p-6 border-b border-slate-100 dark:border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white">Player Profile</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">
                Customize Identity & Permissions
              </DialogDescription>
            </div>
          </div>

          {/* Avatar Edit Section */}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-muted border-4 border-white dark:border-border shadow-xl overflow-hidden">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-2xl font-black">
                    {player.firstName?.[0]}{player.lastName?.[0]}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg border-4 border-slate-50 dark:border-slate-950"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {selectedFile && (
              <div className="mt-4 flex gap-2 animate-in fade-in zoom-in-95">
                <Button size="sm" onClick={() => uploadImage.mutate(selectedFile)} disabled={uploadImage.isPending} className="h-8 bg-green-600 hover:bg-green-700 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl">
                  {uploadImage.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1.5" />}
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedFile(null); setPreviewImage(player.profileImageUrl || ""); }} className="h-8 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl border-slate-200">
                  Cancel
                </Button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* --- FORM BODY --- */}
        <form onSubmit={(e) => { e.preventDefault(); updatePlayer.mutate(formData); }} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">First Name</Label>
              <Input
                className="h-11 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner"
                value={formData.firstName}
                onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Last Name</Label>
              <Input
                className="h-11 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner"
                value={formData.lastName}
                onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <Input
                type="email"
                className="h-11 pl-10 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nickname</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                <Input
                  className="h-11 pl-10 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner"
                  value={formData.nickname}
                  onChange={(e) => setFormData(p => ({ ...p, nickname: e.target.value }))}
                  placeholder="e.g. 'The Wall'"
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sportPositions.length > 0 && (
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Primary Position</Label>
              <Select value={formData.position} onValueChange={(v) => setFormData(p => ({ ...p, position: v }))}>
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-muted border-none rounded-xl font-bold shadow-inner">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                  <SelectValue placeholder="Select Position..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {sportPositions.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* --- FOOTER ACTIONS --- */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 rounded-2xl">
              Discard
            </Button>
            <Button
              type="submit"
              disabled={updatePlayer.isPending}
              className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95"
            >
              {updatePlayer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
