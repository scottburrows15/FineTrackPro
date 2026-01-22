import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { 
  Bell, 
  CreditCard, 
  Palette, 
  Moon, 
  Sun,
  LogOut,
  Settings,
  Mail,
  Smartphone,
  Calendar,
  Receipt,
  HelpCircle,
  ChevronRight,
  Laptop,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PlayerSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [fineReminders, setFineReminders] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);

  const [mobilePassword, setMobilePassword] = useState("");
  const [mobileConfirmPassword, setMobileConfirmPassword] = useState("");
  const [showMobilePassword, setShowMobilePassword] = useState(false);
  const [showMobileConfirmPassword, setShowMobileConfirmPassword] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { data: mobileStatus, refetch: refetchMobileStatus } = useQuery<{ hasMobileAccess: boolean; email: string | null }>({
    queryKey: ["/api/auth/mobile-status"],
    enabled: !!user,
  });

  const setMobilePasswordMutation = useMutation({
    mutationFn: async (data: { password: string; confirmPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/set-mobile-password", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mobile access enabled",
        description: data.message,
      });
      setMobilePassword("");
      setMobileConfirmPassword("");
      refetchMobileStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set mobile password",
        variant: "destructive",
      });
    },
  });

  const handleSetMobilePassword = () => {
    if (mobilePassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (mobilePassword !== mobileConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }
    setMobilePasswordMutation.mutate({ password: mobilePassword, confirmPassword: mobileConfirmPassword });
  };

  const handleLogout = async () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="App Settings"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 overflow-x-hidden">

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Notifications Settings */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your alerts</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium text-sm">Email Notifications</Label>
                      <p className="text-xs text-slate-500">Receive email updates</p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium text-sm">Push Notifications</Label>
                      <p className="text-xs text-slate-500">Get instant updates</p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="fine-reminders" className="font-medium text-sm">Fine Reminders</Label>
                      <p className="text-xs text-slate-500">Unpaid fine alerts</p>
                    </div>
                  </div>
                  <Switch
                    id="fine-reminders"
                    checked={fineReminders}
                    onCheckedChange={setFineReminders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label htmlFor="payment-notifications" className="font-medium text-sm">Payment Confirmations</Label>
                      <p className="text-xs text-slate-500">Payment status updates</p>
                    </div>
                  </div>
                  <Switch
                    id="payment-notifications"
                    checked={paymentNotifications}
                    onCheckedChange={setPaymentNotifications}
                  />
                </div>
              </div>
            </Card>

            {/* Payment Settings */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Payments</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your payment methods</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/payment")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Methods</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/player/fines")}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4" />
                    <span>Payment History</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Theme Settings */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Choose your theme</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === "light" 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sun className="h-5 w-5 text-slate-700" />
                    <span className="text-xs font-medium">Light</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === "dark" 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs font-medium">Dark</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme("system")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === "system" 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Laptop className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs font-medium">System</span>
                  </div>
                </button>
              </div>
            </Card>

            {/* Mobile Access Settings */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mobile App Access</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {mobileStatus?.hasMobileAccess 
                      ? "Mobile access is enabled" 
                      : "Set up a password to use the mobile app"}
                  </p>
                </div>
              </div>

              {mobileStatus?.hasMobileAccess ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Mobile access enabled</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Log in to the mobile app with: {mobileStatus.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Create a password to log into the FoulPay mobile app using your email address.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="mobile-password"
                        type={showMobilePassword ? "text" : "password"}
                        value={mobilePassword}
                        onChange={(e) => setMobilePassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMobilePassword(!showMobilePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showMobilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile-confirm-password" className="text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="mobile-confirm-password"
                        type={showMobileConfirmPassword ? "text" : "password"}
                        value={mobileConfirmPassword}
                        onChange={(e) => setMobileConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMobileConfirmPassword(!showMobileConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showMobileConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSetMobilePassword}
                    disabled={setMobilePasswordMutation.isPending || mobilePassword.length < 8}
                    className="w-full"
                  >
                    {setMobilePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Enable Mobile Access
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Support & Actions */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/help")}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            FoulPay v1.0.0
          </p>
        </div>
      </div>
    </AppLayout>
  );
}