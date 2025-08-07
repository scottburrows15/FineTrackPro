import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Gavel, Bell, ChevronDown, LogOut, User, Settings, Users, AlertTriangle, Tags, Download } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import ProfileModal from "@/components/profile-modal";

interface NavigationProps {
  user: UserType | null;
  currentView: 'player' | 'admin';
  onViewChange: (view: 'player' | 'admin') => void;
  canSwitchView: boolean;
}

export default function Navigation({ user, currentView, onViewChange, canSwitchView }: NavigationProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications ? notifications.filter((n: any) => !n.isRead)?.length : 0;

  const handleAdminAction = (action: string) => {
    switch (action) {
      case 'unpaid-fines':
        // This would trigger the admin dashboard to show unpaid fines
        if (currentView !== 'admin') {
          onViewChange('admin');
        }
        // Add logic to show unpaid fines section
        break;
      case 'team-members':
        if (currentView !== 'admin') {
          onViewChange('admin');
        }
        // Add logic to show team members section
        break;
      case 'categories':
        // Future feature
        break;
      case 'export':
        // Future feature
        break;
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Gavel className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold text-slate-900">TeamFines Pro</span>
              </div>
              
              {canSwitchView && (
                <div className="hidden md:flex space-x-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => onViewChange('player')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'player'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Player View
                  </button>
                  <button
                    onClick={() => onViewChange('admin')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'admin'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admin View
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 text-slate-600 hover:text-slate-900 relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-danger text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 p-2 bg-slate-200 rounded-full" />
                    )}
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {user?.firstName || 'User'} {user?.lastName || ''}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAdminAction('unpaid-fines')}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        View Unpaid Fines
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAdminAction('team-members')}>
                        <Users className="w-4 h-4 mr-2" />
                        Manage Team
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAdminAction('categories')}>
                        <Tags className="w-4 h-4 mr-2" />
                        Manage Categories
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAdminAction('export')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile View Toggle */}
      {canSwitchView && (
        <div className="md:hidden bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 my-3">
              <button
                onClick={() => onViewChange('player')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'player'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Player View
              </button>
              <button
                onClick={() => onViewChange('admin')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'admin'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin View
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </>
  );
}
