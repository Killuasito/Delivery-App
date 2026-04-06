"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Meu Carrinho</h1>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 p-4">
        <CartSummary />
      </div>
    </div>
  );
}