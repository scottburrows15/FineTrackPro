import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  formatDistanceToNow, 
  isToday,
  isYesterday,
  subMonths 
} from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { 
  AlertTriangle, 
  PoundSterling, 
  Inbox, 
  BellRing, 
  Loader2, 
  Info,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function PlayerNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewFilter, setViewFilter] = useState<"all" | "unread">("all");
  const [showOlder, setShowOlder] = useState(false);

  const { data: notifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  /**
   * 1. STRICT PLAYER FILTERING
   * - Must belong to current user (backend already filters by userId)
   * - Exclude Admin-only types (fine_paid/fine_deleted)
   * - Auto-expire read notes older than 3 months
   */
  const myNotifications = useMemo(() => {
    if (!user) return [];
    const expiryCutoff = subMonths(new Date(), 3);
    
    return notifications.filter(n => 
      n.userId === user.id && 
      n.type !== 'fine_paid' && 
      n.type !== 'fine_deleted' &&
      (!n.isRead || (n.createdAt && new Date(n.createdAt) >= expiryCutoff))
    );
  }, [notifications, user]);

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const displayedNotifications = useMemo(() => {
    return myNotifications.filter(n => 
      viewFilter === "unread" ? !n.isRead : true
    );
  }, [myNotifications, viewFilter]);

  /**
   * 2. PAGINATION & GROUPING
   * Shows 10 most recent, then groups remaining behind "See More"
   */
  const { visibleItems, hiddenItems } = useMemo(() => {
    const limit = 10;
    return {
      visibleItems: displayedNotifications.slice(0, limit),
      hiddenItems: displayedNotifications.slice(limit)
    };
  }, [displayedNotifications]);

  const groupNotifications = (list: Notification[]) => {
    const groups: Record<string, Notification[]> = { 
      "Today": [],
      "Yesterday": [],
      "Earlier": []
    };

    list.forEach(note => {
      const d = note.createdAt ? new Date(note.createdAt) : new Date();
      if (isToday(d)) groups["Today"].push(note);
      else if (isYesterday(d)) groups["Yesterday"].push(note);
      else groups["Earlier"].push(note);
    });

    return Object.entries(groups).filter(([, v]) => v.length > 0);
  };

  const visibleGroups = useMemo(() => groupNotifications(visibleItems), [visibleItems]);
  const hiddenGroups = useMemo(() => groupNotifications(hiddenItems), [hiddenItems]);

  /**
   * 3. MUTATIONS
   */
  const markRead = useMutation({
    mutationFn: (id: string) => 
      apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
  });

  const markUnread = useMutation({
    mutationFn: (id: string) => 
      apiRequest("PATCH", `/api/notifications/${id}/unread`),
    onSuccess: () => {
      toast({ description: "Marked as unread" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  const markAllRead = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/notifications/mark-all-read`, { 
        types: ['fine_issued', 'reminder', 'team_update', 'fine_removed', 'payment_confirmed'] 
      }),
    onSuccess: () => {
      toast({ description: "All marked as read" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setViewFilter('all');
    }
  });

  /**
   * 4. STYLE HELPERS
   */
  const getStyle = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        icon: type === 'fine_issued' ? AlertTriangle : Info,
        bg: "bg-slate-100", 
        color: "text-slate-400",
        title: type === 'fine_issued' ? "Fine Issued" : "Update",
        urgent: false
      };
    }

    switch (type) {
      case "fine_issued":
        return { 
          icon: AlertTriangle, 
          bg: "bg-red-50 animate-pulse", 
          color: "text-red-600",
          title: "Fine Issued",
          urgent: true
        };
      case "reminder":
        return { 
          icon: BellRing, 
          bg: "bg-amber-50", 
          color: "text-amber-600",
          title: "Reminder",
          urgent: false
        };
      default:
        return { 
          icon: Info, 
          bg: "bg-blue-50", 
          color: "text-blue-600",
          title: "Update",
          urgent: false
        };
    }
  };

  const renderNotification = (note: Notification) => {
    const style = getStyle(note.type, note.isRead);
    const Icon = style.icon;
    const noteDate = note.createdAt ? new Date(note.createdAt) : new Date();
    const timeAgo = formatDistanceToNow(noteDate, { addSuffix: false });
    const timeShort = timeAgo.includes('minute') ? timeAgo.split(' ')[0] + 'm' : 
                      timeAgo.includes('hour') ? timeAgo.split(' ')[0] + 'h' :
                      timeAgo.includes('day') ? timeAgo.split(' ')[0] + 'd' : timeAgo;

    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative"
      >
        {/* Swipe Layer: Mark Unread */}
        {note.isRead && (
          <div className="absolute inset-0 bg-blue-500 rounded-xl flex items-center justify-end px-4 z-0 mb-2 overflow-hidden">
             <span className="text-white text-[10px] font-bold uppercase tracking-wider mr-2">Mark Unread</span>
             <RotateCcw className="text-white w-4 h-4" />
          </div>
        )}

        {/* Card Layer */}
        <motion.div
          drag={note.isRead ? "x" : false} 
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 && note.isRead) {
              markUnread.mutate(note.id);
            }
          }}
          onClick={() => !note.isRead && markRead.mutate(note.id)}
          className={cn(
            "relative z-10 flex gap-3 p-3 rounded-xl border transition-all select-none",
            // Solid Backgrounds to prevent swipe action bleed-through
            !note.isRead && style.urgent ? "bg-white border-red-500 shadow-sm" : 
            !note.isRead ? "bg-white border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]" : 
            "bg-slate-50 border-slate-100" 
          )}
          style={{ x: 0 }} 
        >
          {/* Blue Dot */}
          {!note.isRead && (
            <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
          )}

          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            style.bg
          )}>
            <Icon className={cn("w-4 h-4", style.color)} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-xs font-bold leading-none",
                note.isRead ? "text-slate-500" : "text-slate-900"
              )}>
                {style.title}
              </span>
              <span className="text-[10px] text-slate-400 font-medium pr-3">
                {timeShort}
              </span>
            </div>
            
            <p className={cn(
              "text-[13px] mt-1 leading-snug break-words pr-2",
              note.isRead ? "text-slate-400" : "text-slate-600"
            )}>
              {note.message}
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!user) return null;

  return (
    <AppLayout
      user={user}
      currentView="player"
      pageTitle="Inbox"
      unreadNotifications={unreadCount}
      onViewChange={() => {}}
      canSwitchView={user.role === "admin"}
    >
      <div className="flex flex-col h-full max-w-md mx-auto bg-slate-50/50">
        
        {/* Floating Pill Header */}
        <div className="px-4 pt-3 pb-1 shrink-0 z-20">
          <div className="flex justify-between items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["all", "unread"].map(v => (
                <button
                  key={v}
                  onClick={() => setViewFilter(v as any)}
                  className={cn(
                    "px-4 py-1.5 text-[11px] font-bold rounded-lg uppercase transition-all",
                    viewFilter === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 h-7 px-3 mr-1 uppercase tracking-wide"
              >
                {markAllRead.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCheck className="w-3.5 h-3.5 mr-1.5" />}
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-6 pb-24">
            
            {isError && (
              <div className="p-3 bg-amber-50 text-amber-700 text-xs text-center rounded-xl">
                Offline mode — notifications may be delayed
              </div>
            )}

            {!isLoading && displayedNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-24 opacity-50">
                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-xs font-medium">No notifications</p>
              </div>
            )}

            {/* Current/Visible Slice */}
            {visibleGroups.map(([label, notes]) => (
              <div key={`visible-${label}`} className="space-y-2">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                  {label}
                </h4>
                <AnimatePresence mode="popLayout">
                  {notes.map(renderNotification)}
                </AnimatePresence>
              </div>
            ))}

            {/* Pagination/Hidden Slice */}
            {hiddenItems.length > 0 && (
              <div className="pt-2">
                {!showOlder ? (
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-slate-400 hover:bg-slate-100 h-9 font-bold uppercase tracking-wide"
                    onClick={() => setShowOlder(true)}
                  >
                    See {hiddenItems.length} more <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 pt-2">
                    {hiddenGroups.map(([label, notes]) => (
                      <div key={`hidden-${label}`} className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1 opacity-70">
                          {label}
                        </h4>
                        <AnimatePresence mode="popLayout">
                          {notes.map(renderNotification)}
                        </AnimatePresence>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-slate-400 h-8 mt-4"
                      onClick={() => setShowOlder(false)}
                    >
                      Show less <ChevronUp className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
