import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSupported =
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "serviceWorker" in navigator;

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    checkSubscription();
  }, [isSupported]);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return;

    const registration = await navigator.serviceWorker.ready;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("VITE_VAPID_PUBLIC_KEY not set");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const subJson = subscription.toJSON();
    await apiRequest("POST", "/api/push/subscribe", {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      },
    });

    setIsSubscribed(true);
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiRequest("POST", "/api/push/unsubscribe", {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe,
  };
}
