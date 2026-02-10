import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowLeft, Crown, Users } from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import type { Notification } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function CreateTeam() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createData, setCreateData] = useState({
    teamName: "",
    sport: "",
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; sport: string }) => {
      return await apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      toast({
        title: "Team Created!",
        description: "You're now the admin of your new team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/teams"] });
      setTimeout(() => {
        window.location.href = "/admin/home";
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Team",
        description: error instanceof Error ? error.message : "Unable to create team",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.teamName.trim() || !createData.sport) return;
    createTeamMutation.mutate({ name: createData.teamName.trim(), sport: createData.sport });
  };

  if (!user) return null;

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Create Team"
      unreadNotifications={unreadCount}
      canSwitchView={false}
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/profile")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create New Team</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Start fresh with your own team and become the admin</p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="e.g., Manchester United FC"
                  value={createData.teamName}
                  onChange={(e) => setCreateData(prev => ({ ...prev, teamName: e.target.value }))}
                  className="text-lg"
                  maxLength={50}
                  disabled={createTeamMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <Select
                  value={createData.sport}
                  onValueChange={(value) => setCreateData(prev => ({ ...prev, sport: value }))}
                  disabled={createTeamMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your team's sport..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Rugby">Rugby</SelectItem>
                    <SelectItem value="Netball">Netball</SelectItem>
                    <SelectItem value="Hockey">Hockey</SelectItem>
                    <SelectItem value="Darts">Darts</SelectItem>
                    <SelectItem value="Golf">Golf</SelectItem>
                    <SelectItem value="Pool">Pool</SelectItem>
                    <SelectItem value="Cricket">Cricket</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold"
                disabled={createTeamMutation.isPending || !createData.teamName.trim() || !createData.sport}
              >
                {createTeamMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Creating Team...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Create Team</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
