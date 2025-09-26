import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getPositionsForSport } from "@/lib/sportPositions";
import { UserPlus, Save } from "lucide-react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TeamInfo {
  id: string;
  name: string;
  sport: string;
  inviteCode: string;
}

export default function AddPlayerModal({ isOpen, onClose }: AddPlayerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
  });

  const addPlayer = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/add-player", data);
    },
    onSuccess: () => {
      toast({
        title: "Player Added",
        description: "The player has been added to the team successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
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

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      nickname: "",
    });
  };

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

    addPlayer.mutate(formData);
  };

  const sportPositions = teamInfo?.sport ? getPositionsForSport(teamInfo.sport) : [];
  const showPositions = sportPositions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <UserPlus className="w-5 h-5" />
            <span>Add New Player</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <Label htmlFor="nickname">Team Nickname (Optional)</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Enter team nickname"
            />
          </div>

          {showPositions && (
            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {sportPositions.map((position: string) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPlayer.isPending}
              className="flex-1 flex items-center space-x-2"
            >
              {addPlayer.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{addPlayer.isPending ? 'Adding...' : 'Add Player'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}