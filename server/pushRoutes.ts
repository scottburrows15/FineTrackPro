import { Router } from "express";
import webpush from "web-push";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

const router = Router();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@foulpay.com",
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log("✅ VAPID keys configured for push notifications");
} else {
  console.warn("⚠️ VAPID keys not configured. Push notifications will not work.");
}

router.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

router.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription data" });
    }

    await storage.savePushSubscription(userId, {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    res.json({ message: "Subscription saved" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    res.status(500).json({ message: "Failed to save subscription" });
  }
});

router.post("/api/push/unsubscribe", isAuthenticated, async (req: any, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    await storage.removePushSubscription(endpoint);
    res.json({ message: "Subscription removed" });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    res.status(500).json({ message: "Failed to remove subscription" });
  }
});

router.post("/api/push/test", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const subscriptions = await storage.getPushSubscriptionsForUser(userId);

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: "No push subscriptions found" });
    }

    const payload = JSON.stringify({
      title: "FoulPay Test",
      body: "Push notifications are working! 🎉",
      icon: "/logo.png",
      badge: "/whistle-icon.png",
      url: "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    for (const result of results) {
      if (result.status === "rejected" && (result.reason as any)?.statusCode === 410) {
        const failedSub = subscriptions[results.indexOf(result)];
        if (failedSub) {
          await storage.removePushSubscription(failedSub.endpoint);
        }
      }
    }

    res.json({ message: `Sent ${succeeded} notification(s), ${failed} failed` });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Failed to send test notification" });
  }
});

export default router;
