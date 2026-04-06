"use client";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { saveFcmToken } from "@/lib/firebase/firestore";

/**
 * Registers the device for FCM push notifications and saves the token to
 * Firestore so the Cloud Function can send targeted messages.
 *
 * Only activates on native Capacitor (Android / iOS). No-ops in the browser.
 */
export const usePushNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    const register = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.register();

      // Save token when first received or refreshed
      PushNotifications.addListener("registration", async ({ value: token }) => {
        try {
          await saveFcmToken(userId, token);
        } catch (e) {
          console.error("Failed to save FCM token", e);
        }
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error", err);
      });

      // Show foreground notifications as an in-app alert
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        const { title, body } = notification;
        if (title || body) {
          alert(`${title ?? ""}\n${body ?? ""}`.trim());
        }
      });
    };

    register();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId]);
};
