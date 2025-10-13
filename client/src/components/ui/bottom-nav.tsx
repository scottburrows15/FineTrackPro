import { Gavel, BarChart3, Home, Bell, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavProps {
  currentView: 'player' | 'admin';
  unreadCount: number;
}

export default function BottomNav({ currentView, unreadCount }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const navItems = currentView === 'player' 
    ? [
        { id: 'fines', path: '/player/fines', icon: Gavel, label: 'Fines', color: 'text-red-500' },
        { id: 'stats', path: '/player/stats', icon: BarChart3, label: 'Stats', color: 'text-emerald-500' },
        { id: 'home', path: '/player/home', icon: Home, label: 'Home', color: 'text-blue-500' },
        { id: 'notifications', path: '/player/notifications', icon: Bell, label: 'Alerts', color: 'text-purple-500', badge: unreadCount },
        { id: 'settings', path: '/player/settings', icon: Settings, label: 'Settings', color: 'text-slate-500' },
      ]
    : [
        { id: 'fines', path: '/admin/fines', icon: Gavel, label: 'Issue', color: 'text-red-500' },
        { id: 'analytics', path: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'text-emerald-500' },
        { id: 'home', path: '/admin/home', icon: Home, label: 'Dashboard', color: 'text-blue-500' },
        { id: 'notifications', path: '/admin/notifications', icon: Bell, label: 'Alerts', color: 'text-purple-500', badge: unreadCount },
        { id: 'settings', path: '/admin/settings', icon: Settings, label: 'Team', color: 'text-amber-500' },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200 min-w-[60px] sm:min-w-[70px] relative
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                data-testid={`bottom-nav-${item.id}`}
              >
                <div className="relative">
                  <Icon 
                    className={`
                      h-5 w-5 sm:h-6 sm:w-6 transition-colors
                      ${isActive ? item.color : 'text-slate-600 dark:text-slate-400'}
                    `}
                  />
                {item.id === 'notifications' && item.badge > 0 && (
                    <div 
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-slate-900 px-1"
                      data-testid={`badge-${item.id}`}
                    >
                      <span className="text-[10px] font-bold text-white leading-none">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    </div>
                  )}
                </div>
                <span 
                  className={`
                    text-[10px] sm:text-xs font-medium transition-colors
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400'
                    }
                  `}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
