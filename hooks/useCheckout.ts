"use client";
import { useState } from "react";
import { createOrder } from "@/lib/firebase/firestore";
import { useCartStore } from "@/store/cartStore";

interface CheckoutData {
  userId: string;
  userEmail: string;
  deliveryDate: string;
  deliveryAddress: string;
  paymentMethod: string;
}

type CheckoutStatus = "idle" | "loading" | "success" | "error";

export const useCheckout = () => {
  const [status, setStatus]   = useState<CheckoutStatus>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const { items, getTotalPrice, clearCart } = useCartStore();

  const checkout = async (data: CheckoutData) => {
    if (items.length === 0) {
      setError("Seu carrinho esta vazio.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const id = await createOrder({
        ...data,
        items,
        totalPrice: getTotalPrice(),
      });

      setOrderId(id);
      setStatus("success");
      clearCart();

    } catch (err) {
      console.error("Erro no checkout:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao finalizar pedido. Tente novamente."
      );
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setOrderId(null);
    setError(null);
  };

  return { checkout, status, orderId, error, reset };
};