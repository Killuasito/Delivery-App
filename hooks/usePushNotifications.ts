"use client";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { saveFcmToken } from "@/lib/firebase/firestore";

export const usePushNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const register = async () => {
      try {
        // Lazy import to avoid crashing on web or if plugin isn't available
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== "granted") return;

        await PushNotifications.register();

        if (cancelled) return;

        await PushNotifications.addListener("registration", async ({ value: token }) => {
          try {
            await saveFcmToken(userId, token);
          } catch (e) {
            console.error("Failed to save FCM token", e);
          }
        });

        await PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error", err);
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const { title, body } = notification;
          if (title || body) {
            alert(`${title ?? ""}\n${body ?? ""}`.trim());
          }
        });
      } catch (e) {
        // Never crash the app due to notification setup failure
        console.error("Push notifications setup failed", e);
      }
    };

    register();

    return () => {
      cancelled = true;
      import("@capacitor/push-notifications")
        .then(({ PushNotifications }) => PushNotifications.removeAllListeners())
        .catch(() => undefined);
    };
  }, [userId]);
};
