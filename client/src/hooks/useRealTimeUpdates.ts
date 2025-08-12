import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RealTimeUpdateOptions {
  enableNotifications?: boolean;
  updateInterval?: number;
  autoRefreshQueries?: string[];
}

export function useRealTimeUpdates({
  enableNotifications = true,
  updateInterval = 30000, // 30 seconds
  autoRefreshQueries = [],
}: RealTimeUpdateOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const handleVisibilityChange = useCallback(() => {
    isActiveRef.current = !document.hidden;
    
    if (isActiveRef.current) {
      // Immediately refresh when tab becomes active
      autoRefreshQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    }
  }, [queryClient, autoRefreshQueries]);

  const performUpdate = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      // Check for new notifications
      if (enableNotifications) {
        const previousNotifications = queryClient.getQueryData(['/api/notifications']) as any[] || [];
        
        // Invalidate notifications to get fresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        
        // Wait a bit for the query to resolve
        setTimeout(() => {
          const currentNotifications = queryClient.getQueryData(['/api/notifications']) as any[] || [];
          
          // Check for new notifications
          const newNotifications = currentNotifications.filter(
            current => !previousNotifications.some(prev => prev.id === current.id)
          );

          // Show toast for new notifications
          newNotifications.slice(0, 3).forEach((notification, index) => {
            setTimeout(() => {
              toast({
                title: "New Notification",
                description: notification.message,
                duration: 5000,
              });
            }, index * 1000); // Stagger notifications
          });
        }, 1000);
      }

      // Refresh other queries
      autoRefreshQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

    } catch (error) {
      console.error('Real-time update error:', error);
    }
  }, [queryClient, enableNotifications, autoRefreshQueries, toast]);

  useEffect(() => {
    // Set up periodic updates
    if (updateInterval > 0) {
      intervalRef.current = setInterval(performUpdate, updateInterval);
    }

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up online/offline listeners
    const handleOnline = () => {
      toast({
        title: "Connection Restored",
        description: "You're back online. Syncing latest data...",
        duration: 3000,
      });
      performUpdate();
    };

    const handleOffline = () => {
      toast({
        title: "Connection Lost",
        description: "You're now offline. Some features may be limited.",
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateInterval, handleVisibilityChange, performUpdate, toast]);

  // Manual refresh function
  const refresh = useCallback(() => {
    performUpdate();
  }, [performUpdate]);

  return {
    refresh,
    isOnline: navigator.onLine,
    isActive: isActiveRef.current,
  };
}

export default useRealTimeUpdates;