import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  PoundSterling, // Changed from DollarSign
  Inbox,
  BellRing,
  Loader2,
  Trash2 // Added for delete events
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function PlayerNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- Grouping ---
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    notifications.forEach(note => {
      const date = new Date(note.createdAt);
      if (isToday(date)) {
        groups['Today'].push(note);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(note);
      } else {
        groups['Earlier'].push(note);
      }
    });

    return Object.entries(groups).filter(([_, notes]) => notes.length > 0);
  }, [notifications]);

  // --- Mutation ---
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ description: "All marked as read" });
    },
    onError: () => {
      toast({ description: "Marked all as read (Demo)" });
    }
  });

  // --- Styles & Icons ---
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'fine_issued':
        return { 
          icon: AlertTriangle, 
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          title: 'Fine Issued'
        };
      case 'fine_paid':
        return { 
          icon: PoundSterling, // Updated to Pound Sign
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          title: 'Payment Received'
        };
      case 'fine_deleted': // Handle deletes/cancellations
      case 'fine_cancelled':
        return {
          icon: Trash2, // Bin Icon
          color: 'text-slate-600',
          bgColor: 'bg-slate-100',
          title: 'Fine Cancelled'
        };
      case 'reminder':
        return { 
          icon: BellRing, 
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          title: 'Reminder'
        };
      default:
        return { 
          icon: Bell, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          title: 'Update'
        };
    }
  };

  if (!user) return null;

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Inbox"
      unreadNotifications={unreadCount}
      onViewChange={() => {}}
      canSwitchView={user.role === 'admin'}
    >
      <div className="relative flex flex-col h-[calc(100dvh-140px)] max-w-md mx-auto px-4 pt-4">
        
        {/* Action Bar */}
        <div className="flex justify-end mb-2 shrink-0 min-h-[32px]">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20 opacity-50">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="pb-20 space-y-6">
              {groupedNotifications.map(([groupName, groupNotes]) => (
                <div key={groupName} className="space-y-3">
                  
                  {/* Sticky Date Header */}
                  <div className="sticky top-0 z-10 flex items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/95 backdrop-blur-md px-2 py-1 rounded-md">
                      {groupName}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {groupNotes.map((notification) => {
                      const style = getNotificationStyle(notification.type);
                      const Icon = style.icon;
                      const timeSince = notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'just now';
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={cn(
                            "group relative flex items-start p-4 rounded-2xl transition-all duration-200 select-none",
                            // VISUAL DESIGN:
                            // Unread: Subtle blue tint, soft blue ring, shadow
                            !notification.isRead 
                              ? "bg-blue-50/40 ring-1 ring-blue-100 shadow-sm" 
                              // Read: Clean white, transparent border
                              : "bg-white border border-slate-100"
                          )}
                        >
                          {/* Column 1: Icon */}
                          <div className={cn(
                            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4 mt-0.5",
                            style.bgColor
                          )}>
                            <Icon className={cn("w-5 h-5", style.color)} />
                          </div>

                          {/* Column 2: Content */}
                          <div className="flex-1 min-w-0 mr-3">
                            <h4 className={cn(
                              "text-sm mb-0.5",
                              !notification.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                            )}>
                              {style.title}
                            </h4>
                            <p className={cn(
                              "text-sm leading-relaxed",
                              !notification.isRead ? "text-slate-800" : "text-slate-500"
                            )}>
                              {notification.message}
                            </p>
                          </div>

                          {/* Column 3: Meta (Time + Dot) */}
                          <div className="flex flex-col items-end justify-start h-full shrink-0 gap-2">
                            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap mt-1">
                              {timeSince.replace('about ', '')}
                            </span>
                            
                            {/* Pulsating Dot */}
                            {!notification.isRead && (
                              <div className="relative flex h-2.5 w-2.5 mt-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                              </div>
                            )}
                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </AppLayout>
  );
}
