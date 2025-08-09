import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Gavel, Bell, ChevronDown, LogOut, User, Settings, Users, AlertTriangle, Tags, Download, CheckCircle, Clock } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import ProfileModal from "@/components/profile-modal";
import { getDisplayName, getFullName } from "@/lib/userUtils";

interface NavigationProps {
  user: UserType | null;
  currentView: 'player' | 'admin';
  onViewChange: (view: 'player' | 'admin') => void;
  canSwitchView: boolean;
}

export default function Navigation({ user, currentView, onViewChange, canSwitchView }: NavigationProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'fine_issued':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'fine_paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatNotificationTime = (createdAt: string | null) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

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
              {/* Interactive Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative p-2 text-slate-600 hover:text-slate-900"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs text-slate-400">You'll see updates about fines here</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {notifications.length > 10 && (
                        <div className="p-3 text-center border-t border-slate-200">
                          <p className="text-xs text-slate-500">
                            Showing 10 of {notifications.length} notifications
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {notifications.length > 0 && unreadCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            // Mark all as read
                            notifications
                              .filter(n => !n.isRead)
                              .forEach(n => handleMarkAsRead(n.id));
                          }}
                          disabled={markAsReadMutation.isPending}
                        >
                          {markAsReadMutation.isPending ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full" />
                              <span>Marking as read...</span>
                            </div>
                          ) : (
                            `Mark all as read (${unreadCount})`
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
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
                      {getFullName(user)}
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
        />
      )}
    </>
  );
}
