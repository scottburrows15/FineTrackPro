import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFullName } from "@/lib/userUtils";
import { apiRequest } from "@/lib/queryClient";
import { Gavel, Users, CheckCircle } from "lucide-react";

export default function JoinTeam() {
  const [, params] = useRoute("/join/:inviteCode");
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [position, setPosition] = useState("");
  
  const inviteCode = params?.inviteCode;

  useEffect(() => {
    // If user is already authenticated and has a team, redirect to home
    if (user && user.teamId) {
      window.location.href = "/";
    }
  }, [user]);

  const handleJoinTeam = async () => {
    if (!inviteCode) return;
    
    setIsJoining(true);
    try {
      await apiRequest("POST", "/api/teams/join", {
        inviteCode: inviteCode.toUpperCase(),
        position,
      });

      toast({
        title: "Successfully joined team!",
        description: "Welcome to your new team. You can now view and pay fines.",
      });

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      toast({
        title: "Failed to join team",
        description: error instanceof Error ? error.message : "Invalid invite code",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Join Team</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-6">
              You need to sign in to join the team with invite code <strong>{inviteCode}</strong>
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Join Your Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>Invite Code: {inviteCode}</span>
            </div>
            <p className="text-slate-600 text-sm">
              You're joining as <strong>{getFullName(user)}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Playing Position (Optional)</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Striker, Midfielder, Defender"
              className="text-center"
            />
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleJoinTeam}
              disabled={isJoining}
              className="w-full"
            >
              {isJoining ? "Joining Team..." : "Join Team"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-slate-500 text-center">
            By joining, you agree to receive notifications about team fines and payments.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
