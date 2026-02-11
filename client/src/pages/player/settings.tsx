import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { 
  Bell, 
  CreditCard, 
  Moon, 
  Sun,
  LogOut,
  Receipt,
  HelpCircle,
  ChevronRight,
  Laptop,
  Palette
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/ui/theme-provider";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getDisplayName } from "@/lib/userUtils";

export default function PlayerSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { isSupported, permission, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) return null;

  const displayName = getDisplayName(user);
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

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
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-14 w-14 shadow-md ring-1 ring-slate-200 dark:ring-slate-600">
            {user.profileImageUrl && (
              <AvatarImage
                src={user.profileImageUrl}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email || "Player"}
            </p>
          </div>
          <button
            onClick={() => setLocation("/profile")}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 whitespace-nowrap flex items-center gap-1"
          >
            Edit profile <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">General</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <SettingsRow
              icon={Bell}
              label="Push Notifications"
              trailing={
                <Switch
                  checked={isSubscribed}
                  disabled={!isSupported || permission === "denied"}
                  onCheckedChange={(checked) => {
                    if (checked) requestPermission();
                    else unsubscribe();
                  }}
                />
              }
              subtitle={
                !isSupported ? "Not supported on this device" :
                permission === "denied" ? "Blocked in browser settings" :
                isSubscribed ? "Enabled" : undefined
              }
            />
            <Divider />
            <SettingsRow
              icon={CreditCard}
              label="Payment Methods"
              onClick={() => setLocation("/payment")}
            />
            <Divider />
            <SettingsRow
              icon={Receipt}
              label="Payment History"
              onClick={() => setLocation("/player/fines")}
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Appearance</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ThemeOption
                  icon={Sun}
                  label="Light"
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                />
                <ThemeOption
                  icon={Moon}
                  label="Dark"
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                <ThemeOption
                  icon={Laptop}
                  label="System"
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Other</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <SettingsRow
              icon={HelpCircle}
              label="Help & Support"
              onClick={() => setLocation("/help")}
            />
          </div>
        </section>

        <div className="mt-8">
          <button
            onClick={() => { window.location.href = "/api/logout"; }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-center text-[11px] text-slate-300 dark:text-slate-600 mt-3">
            FoulPay v1.0.0
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsRow({ icon: Icon, label, onClick, trailing, subtitle }: {
  icon: any;
  label: string;
  onClick?: () => void;
  trailing?: ReactNode;
  subtitle?: string;
}) {
  const content = (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {trailing || (onClick && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />)}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        {content}
      </button>
    );
  }
  return content;
}

function ThemeOption({ icon: Icon, label, active, onClick }: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all ${
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
      <span className={`text-xs font-medium ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />;
}
