"use client";
import { ShoppingCart, Plus, Check } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="relative w-full h-40 bg-gray-50 dark:bg-gray-700">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority={priority}
        />
        <span className="absolute top-2 left-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
          {product.category}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex-1 line-clamp-2">{product.description}</p>

        <div className="mt-3">
          <div className="flex items-baseline gap-0.5 mb-2">
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">/ {product.unit}</span>
          </div>

          <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
              added
                ? "bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {added ? (
              <>
                <Check size={14} />
                <span>Adicionado</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};