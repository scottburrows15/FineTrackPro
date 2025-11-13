import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  LogOut,
  Settings,
  Mail,
  Smartphone,
  Calendar,
  Receipt,
  HelpCircle,
  ChevronRight,
  Laptop
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Profile Header Card */}
        <Card className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-semibold">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-blue-100 text-sm">{user.email}</p>
              {user.position && (
                <p className="text-blue-100 text-sm">{user.position}</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLocation("/profile")}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <User className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </Card>

        {/* Quick Settings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card 
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all text-center"
            onClick={() => setLocation("/profile")}
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg inline-flex mb-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Profile</p>
          </Card>

          <Card 
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all text-center"
            onClick={() => setLocation("/player/fines")}
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg inline-flex mb-2">
              <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">My Fines</p>
          </Card>

          <Card 
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all text-center"
            onClick={() => setLocation("/payment")}
          >
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg inline-flex mb-2">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Payments</p>
          </Card>

          <Card 
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all text-center"
            onClick={() => setLocation("/help")}
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg inline-flex mb-2">
              <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Help</p>
          </Card>
        </div>

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

            {/* Account Settings */}
            <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Account</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/profile")}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  onClick={() => setLocation("/privacy")}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4" />
                    <span>Privacy & Security</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
            Fines Tracker v1.0.0
          </p>
        </div>
      </div>
    </AppLayout>
  );
}