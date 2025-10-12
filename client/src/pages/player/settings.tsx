import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { 
  User, 
  Bell, 
  CreditCard, 
  Palette, 
  Shield, 
  Moon, 
  Sun,
  LogOut 
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useTheme } from "@/components/ui/theme-provider";

export default function PlayerSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [fineReminders, setFineReminders] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      pageTitle="Settings"
      unreadNotifications={unreadCount}
      onViewChange={(view) => {
        setLocation(view === 'player' ? '/player/home' : '/admin/home');
      }}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground">Manage your personal information</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/profile")}
                data-testid="button-edit-profile"
              >
                Edit Profile
              </Button>
            </div>
            {user.position && (
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{user.position}</p>
              </div>
            )}
            {user.nickname && (
              <div>
                <p className="text-sm text-muted-foreground">Nickname</p>
                <p className="font-medium">{user.nickname}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Control how you receive updates</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                data-testid="switch-email-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get instant updates</p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                data-testid="switch-push-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fine-reminders" className="font-medium">Fine Reminders</Label>
                <p className="text-sm text-muted-foreground">Reminders for unpaid fines</p>
              </div>
              <Switch
                id="fine-reminders"
                checked={fineReminders}
                onCheckedChange={setFineReminders}
                data-testid="switch-fine-reminders"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="payment-notifications" className="font-medium">Payment Confirmations</Label>
                <p className="text-sm text-muted-foreground">Notifications for payments</p>
              </div>
              <Switch
                id="payment-notifications"
                checked={paymentNotifications}
                onCheckedChange={setPaymentNotifications}
                data-testid="switch-payment-notifications"
              />
            </div>
          </div>
        </Card>

        {/* Payment Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment</h3>
              <p className="text-sm text-muted-foreground">Manage payment methods</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/payment")}
              data-testid="button-payment-methods"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              View Payment Options
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/player/fines")}
              data-testid="button-payment-history"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Payment History
            </Button>
          </div>
        </Card>

        {/* Theme Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Theme</h3>
              <p className="text-sm text-muted-foreground">Customize your appearance</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setTheme("light")}
                data-testid="button-theme-light"
              >
                <Sun className="h-5 w-5 mb-1" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setTheme("dark")}
                data-testid="button-theme-dark"
              >
                <Moon className="h-5 w-5 mb-1" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setTheme("system")}
                data-testid="button-theme-system"
              >
                <Palette className="h-5 w-5 mb-1" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Privacy & Security</h3>
              <p className="text-sm text-muted-foreground">Manage your account security</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-muted-foreground text-center">
            Need help? Visit our{" "}
            <button
              onClick={() => setLocation("/help")}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              data-testid="link-help"
            >
              Help Center
            </button>
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
