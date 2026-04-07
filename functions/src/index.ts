import * as admin from "firebase-admin";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_PASS = defineSecret("GMAIL_APP_PASSWORD");

const STATUS_LABELS: Record<string, string> = {
  confirmado: "✅ Pedido Confirmado",
  entregue:   "📦 Pedido Entregue",
  cancelado:  "❌ Pedido Cancelado",
  pendente:   "🕐 Pedido Pendente",
};

const STATUS_BODIES: Record<string, string> = {
  confirmado: "Seu pedido foi confirmado e está sendo preparado para entrega.",
  entregue:   "Seu pedido foi entregue com sucesso. Bom proveito!",
  cancelado:  "Infelizmente seu pedido foi cancelado. Entre em contato para mais informações.",
  pendente:   "Seu pedido está aguardando confirmação.",
};

/**
 * Triggered whenever an order document is updated.
 * If the status changed, sends an email to the customer.
 */
export const onOrderStatusChanged = onDocumentUpdated(
  { document: "orders/{orderId}", secrets: [GMAIL_USER, GMAIL_PASS] },
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();

    if (!before || !after) return;
    if (before.status === after.status) return;

    const newStatus: string  = after.status;
    const userEmail: string  = after.userEmail;
    const orderId: string    = event.params.orderId;
    const totalPrice: number = after.totalPrice ?? 0;
    const deliveryDate: string = after.deliveryDate ?? "";

    if (!userEmail) {
      console.log(`No email for order ${orderId}`);
      return;
    }

    const subject = STATUS_LABELS[newStatus] ?? "Atualização do seu Pedido";
    const body    = STATUS_BODIES[newStatus] ?? `Seu pedido foi atualizado para: ${newStatus}`;

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#2563eb">${subject}</h2>
        <p>${body}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr>
            <td style="padding:6px 0;color:#6b7280">Pedido</td>
            <td style="padding:6px 0;font-weight:600">#${orderId.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Data de entrega</td>
            <td style="padding:6px 0">${deliveryDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Total</td>
            <td style="padding:6px 0;font-weight:600">R$ ${totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Status</td>
            <td style="padding:6px 0;font-weight:600;text-transform:capitalize">${newStatus}</td>
          </tr>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">
          Obrigado por usar nosso serviço de entrega.
        </p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER.value(),
        pass: GMAIL_PASS.value(),
      },
    });

    await transporter.sendMail({
      from: `"Delivery App" <${GMAIL_USER.value()}>`,
      to: userEmail,
      subject,
      html,
    });

    console.log(`Email sent to ${userEmail} for order ${orderId}: ${newStatus}`);
  }
);
