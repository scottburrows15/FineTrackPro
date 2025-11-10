import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Key, Crown } from "lucide-react";

export default function TeamOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [joinData, setJoinData] = useState({
    inviteCode: "",
  });
  
  const [createData, setCreateData] = useState({
    teamName: "",
    sport: "",
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (data: { inviteCode: string }) => {
      return await apiRequest("POST", "/api/teams/join", data);
    },
    onSuccess: () => {
      toast({
        title: "Team Joined Successfully!",
        description: "Welcome to your team. Redirecting to dashboard...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Team",
        description: error instanceof Error ? error.message : "Invalid team code or team not found",
        variant: "destructive",
      });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; sport: string }) => {
      return await apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      toast({
        title: "Team Created Successfully!",
        description: "You're now the admin of your new team. Setting up your dashboard...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Team",
        description: error instanceof Error ? error.message : "Unable to create team",
        variant: "destructive",
      });
    },
  });

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinData.inviteCode.trim()) {
      toast({
        title: "Missing Team Code",
        description: "Please enter a team code to join",
        variant: "destructive",
      });
      return;
    }

    joinTeamMutation.mutate({ inviteCode: joinData.inviteCode.trim().toUpperCase() });
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createData.teamName.trim()) {
      toast({
        title: "Missing Team Name",
        description: "Please enter a name for your team",
        variant: "destructive",
      });
      return;
    }

    if (!createData.sport) {
      toast({
        title: "Missing Sport",
        description: "Please select your team's sport",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({ name: createData.teamName.trim(), sport: createData.sport });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to FoulPay</h1>
          <p className="text-slate-600 text-lg">Join your team or create a new one to get started</p>
        </div>

        {/* Main Onboarding Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            <Tabs defaultValue="join" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="join" className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>Join Team</span>
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Team</span>
                </TabsTrigger>
              </TabsList>

              {/* Join Team Tab */}
              <TabsContent value="join" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Join Existing Team</h2>
                  <p className="text-slate-600">Enter the team code provided by your team admin</p>
                </div>

                <form onSubmit={handleJoinTeam} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamCode" className="text-sm font-medium">Team Code</Label>
                    <Input
                      id="teamCode"
                      type="text"
                      placeholder="Enter 6-character team code (e.g., ABC123)"
                      value={joinData.inviteCode}
                      onChange={(e) => setJoinData({ inviteCode: e.target.value.toUpperCase() })}
                      className="text-center text-lg font-mono tracking-wider uppercase"
                      maxLength={6}
                      disabled={joinTeamMutation.isPending}
                    />
                    <p className="text-xs text-slate-500 text-center">
                      Team codes are usually 6 characters (mix of letters and numbers)
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                    disabled={joinTeamMutation.isPending || !joinData.inviteCode.trim()}
                  >
                    {joinTeamMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Joining Team...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4" />
                        <span>Join Team</span>
                      </div>
                    )}
                  </Button>
                </form>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Need a team code?</h3>
                  <p className="text-sm text-blue-700">
                    Ask your team admin to share the team code with you. They can find it in their admin dashboard.
                  </p>
                </div>
              </TabsContent>

              {/* Create Team Tab */}
              <TabsContent value="create" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Create New Team</h2>
                  <p className="text-slate-600">Start fresh with your own team and become the admin</p>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-sm font-medium">Team Name</Label>
                    <Input
                      id="teamName"
                      type="text"
                      placeholder="Enter your team name (e.g., Manchester United FC)"
                      value={createData.teamName}
                      onChange={(e) => setCreateData(prev => ({ ...prev, teamName: e.target.value }))}
                      className="text-lg"
                      maxLength={50}
                      disabled={createTeamMutation.isPending}
                    />
                    <p className="text-xs text-slate-500">
                      Choose a name that your team members will recognize
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sport" className="text-sm font-medium">Sport</Label>
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
                    <p className="text-xs text-slate-500">
                      This will determine available player positions and fine categories
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-success hover:bg-emerald-700 text-white py-3"
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

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-emerald-900 mb-1">What happens next?</h3>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• You'll become the team admin with full management access</li>
                    <li>• A unique team code will be generated for inviting players</li>
                    <li>• You can start setting up fine categories and managing your team</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Having trouble? Contact your team admin or check with your team captain for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}