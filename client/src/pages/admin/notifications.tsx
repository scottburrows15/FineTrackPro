import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, isToday, isYesterday, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { 
  AlertTriangle, 
  PoundSterling, 
  Inbox, 
  Loader2, 
  RotateCcw,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function AdminNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewFilter, setViewFilter] = useState<"all" | "unread">("all");
  const [showOlder, setShowOlder] = useState(false);

  const { data: allNotifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // --- Admin Specific Filtering ---
  const adminNotifications = useMemo(() => {
    if (!user || user.role !== 'admin') return [];
    
    // Admin only sees settled fines (paid/deleted) across the team
    // Backend returns all notifications for admins, we filter by type here
    return allNotifications.filter(n => 
      n.type === 'fine_paid' || n.type === 'fine_deleted'
    );
  }, [allNotifications, user]);

  const unreadCount = adminNotifications.filter(n => !n.isRead).length;

  const displayedNotifications = useMemo(() => {
    return adminNotifications.filter(n => 
      viewFilter === "unread" ? !n.isRead : true
    );
  }, [adminNotifications, viewFilter]);

  // --- Pagination Logic ---
  const { visibleItems, hiddenItems } = useMemo(() => {
    return {
      visibleItems: displayedNotifications.slice(0, 10),
      hiddenItems: displayedNotifications.slice(10)
    };
  }, [displayedNotifications]);

  const groupNotifications = (list: Notification[]) => {
    const groups: Record<string, Notification[]> = { "Today": [], "Yesterday": [], "Earlier": [] };
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

  // --- Mutations ---
  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
  });

  const markUnread = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/unread`),
    onSuccess: () => {
      toast({ description: "Marked as unread" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", `/api/notifications/mark-all-read`, {
      types: ['fine_paid', 'fine_deleted']
    }),
    onSuccess: () => {
      toast({ description: "All marked as read" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  const getStyle = (type: string, isRead: boolean) => {
    if (isRead) return { icon: type === 'fine_paid' ? PoundSterling : Trash2, bg: "bg-slate-100", color: "text-slate-400", title: type === 'fine_paid' ? "Payment Received" : "Fine Deleted" };
    
    return type === 'fine_paid' 
      ? { icon: PoundSterling, bg: "bg-emerald-50", color: "text-emerald-600", title: "Payment Received" }
      : { icon: Trash2, bg: "bg-slate-100", color: "text-slate-600", title: "Fine Deleted" };
  };

  if (!user || user.role !== 'admin') return null;

  const renderNotification = (note: Notification) => {
    const style = getStyle(note.type, note.isRead);
    const Icon = style.icon;
    const noteDate = note.createdAt ? new Date(note.createdAt) : new Date();
    const timeAgo = formatDistanceToNow(noteDate, { addSuffix: false });
    const timeShort = timeAgo.includes('minute') ? timeAgo.split(' ')[0] + 'm ago' : 
                      timeAgo.includes('hour') ? timeAgo.split(' ')[0] + 'h ago' :
                      timeAgo.includes('day') ? timeAgo.split(' ')[0] + 'd ago' : timeAgo + ' ago';

    return (
      <motion.div key={note.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
        {note.isRead && (
          <div className="absolute inset-0 bg-blue-500 rounded-xl flex items-center justify-end px-4 z-0 mb-2">
             <RotateCcw className="text-white w-4 h-4" />
          </div>
        )}
        <motion.div
          drag={note.isRead ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => info.offset.x < -80 && markUnread.mutate(note.id)}
          onClick={() => !note.isRead && markRead.mutate(note.id)}
          className={cn(
            "relative z-10 flex gap-3 p-3 rounded-xl border transition-all select-none",
            !note.isRead ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 border-slate-100"
          )}
        >
          {!note.isRead && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />}
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", style.bg)}>
            <Icon className={cn("w-4 h-4", style.color)} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-start">
              <span className={cn("text-xs font-bold", note.isRead ? "text-slate-500" : "text-slate-900")}>{style.title}</span>
              <span className="text-[10px] text-slate-400 font-medium">{timeShort}</span>
            </div>
            <p className={cn("text-[13px] mt-1 leading-snug break-words pr-2", note.isRead ? "text-slate-400" : "text-slate-600")}>{note.message}</p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AppLayout user={user} currentView="admin" pageTitle="Admin Inbox" unreadNotifications={unreadCount} onViewChange={() => {}} canSwitchView={true}>
      <div className="flex flex-col h-full max-w-md mx-auto bg-slate-50/50">
        <div className="px-4 pt-3 pb-1 shrink-0 z-20">
          <div className="flex justify-between items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["all", "unread"].map(v => (
                <button key={v} onClick={() => setViewFilter(v as any)} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-lg uppercase transition-all", viewFilter === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>{v}</button>
              ))}
            </div>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()} className="text-[10px] font-bold text-blue-600 uppercase h-7 px-3">
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-6 pb-24">
            {!isLoading && displayedNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-24 opacity-50">
                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-xs font-medium">No admin updates</p>
              </div>
            )}
            {visibleGroups.map(([label, notes]) => (
              <div key={`v-${label}`} className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">{label}</h4>
                <AnimatePresence mode="popLayout">{notes.map(renderNotification)}</AnimatePresence>
              </div>
            ))}
            {hiddenItems.length > 0 && (
              <div className="pt-2">
                {!showOlder ? (
                  <Button variant="ghost" className="w-full text-xs text-slate-400 font-bold uppercase h-9" onClick={() => setShowOlder(true)}>See {hiddenItems.length} more <ChevronDown className="w-3 h-3 ml-1" /></Button>
                ) : (
                  <div className="space-y-6 pt-2">
                    {hiddenGroups.map(([label, notes]) => (
                      <div key={`h-${label}`} className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1 opacity-70">{label}</h4>
                        <AnimatePresence mode="popLayout">{notes.map(renderNotification)}</AnimatePresence>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-xs text-slate-400 h-8" onClick={() => setShowOlder(false)}>Show less <ChevronUp className="w-3 h-3 ml-1" /></Button>
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
