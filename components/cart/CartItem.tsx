"use client";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";

export const CartItemCard = ({ item }: { item: CartItemType }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  return (
    <div className="flex gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{product.unit}</p>
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
          R$ {(product.price * quantity).toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => removeItem(product.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(product.id, quantity - 1)}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <Minus size={12} className="text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-4 text-center">
            {quantity}
          </span>
          <button
            onClick={() => updateQuantity(product.id, quantity + 1)}
            className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};