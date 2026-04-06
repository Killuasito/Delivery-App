import * as admin from "firebase-admin";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

admin.initializeApp();

const STATUS_LABELS: Record<string, string> = {
  confirmado: "✅ Pedido Confirmado",
  entregue:   "📦 Pedido Entregue",
  cancelado:  "❌ Pedido Cancelado",
  pendente:   "🕐 Pedido Pendente",
};

const STATUS_BODIES: Record<string, string> = {
  confirmado: "Seu pedido foi confirmado e está sendo preparado!",
  entregue:   "Seu pedido foi entregue. Bom proveito!",
  cancelado:  "Infelizmente seu pedido foi cancelado.",
  pendente:   "Seu pedido está aguardando confirmação.",
};

/**
 * Triggered whenever an order document is updated.
 * If the status changed, sends a push notification to the user's device.
 */
export const onOrderStatusChanged = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();

    if (!before || !after) return;
    if (before.status === after.status) return; // no status change

    const newStatus: string = after.status;
    const userId: string    = after.userId;

    if (!userId) return;

    // Fetch the user's FCM token
    const userSnap = await admin.firestore().collection("users").doc(userId).get();
    const fcmToken: string | undefined = userSnap.data()?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }

    const title = STATUS_LABELS[newStatus] ?? "Atualização do Pedido";
    const body  = STATUS_BODIES[newStatus] ?? `Status atualizado para: ${newStatus}`;

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      android: {
        notification: {
          channelId: "delivery_updates",
          priority:  "high",
          sound:     "default",
        },
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1 },
        },
      },
    });

    console.log(`Notification sent to ${userId}: ${title}`);
  }
);
