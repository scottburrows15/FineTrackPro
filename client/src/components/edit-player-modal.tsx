import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPositionsForSport } from "@/lib/sportPositions";
import { UserCog, Mail, User, MapPin, Crown, Save, Camera, Upload, X } from "lucide-react";
import type { User as UserType, Team } from "@shared/schema";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: UserType | null;
}

interface TeamInfo {
  id: string;
  name: string;
  sport: string;
  inviteCode: string;
}

export default function EditPlayerModal({ isOpen, onClose, player }: EditPlayerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch team info to get sport for positions
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
    role: "player",
  });

  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Initialize form when player data changes
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('playerId', player!.id);
      
      const response = await fetch('/api/admin/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewImage(data.imageUrl);
      setSelectedFile(null);
      // Invalidate cache to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({
        title: "Image Uploaded",
        description: "Profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/players/${player?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Player Updated",
        description: "Player profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update player",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide first name, last name, and email.",
        variant: "destructive",
      });
      return;
    }

    updatePlayer.mutate(formData);
  };

  const sportPositions = teamInfo?.sport ? getPositionsForSport(teamInfo.sport) : [];
  const showPositions = sportPositions.length > 0;

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto" aria-describedby="edit-player-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>Edit Player Profile</span>
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <div id="edit-player-description" className="sr-only">
          Edit player profile information and settings
        </div>

        {/* Player Info Header with Profile Picture */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-slate-600">
                      {player.firstName?.[0]}{player.lastName?.[0]}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <div className="font-medium text-slate-900">
                  {player.firstName} {player.lastName}
                </div>
                <div className="text-sm text-slate-600">{player.email}</div>
              </div>
            </div>
            <Badge variant={player.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {player.role === 'admin' ? 'Admin' : 'Player'}
            </Badge>
          </div>

          {/* Image Upload Actions */}
          {selectedFile && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Upload className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 flex-1">{selectedFile.name}</span>
              <Button
                type="button"
                size="sm"
                onClick={() => uploadImage.mutate(selectedFile)}
                disabled={uploadImage.isPending}
                className="text-xs"
              >
                {uploadImage.isPending ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewImage(player.profileImageUrl || "");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Position */}
          {showPositions && (
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                <SelectTrigger className="pl-10">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <SelectValue placeholder="Select position..." />
                </SelectTrigger>
                <SelectContent>
                  {sportPositions.map(position => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Enter nickname (optional)"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="pl-10">
                <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updatePlayer.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={updatePlayer.isPending || !formData.firstName || !formData.lastName || !formData.email}
            >
              {updatePlayer.isPending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {updatePlayer.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}