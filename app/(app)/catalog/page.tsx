"use client";
import { useState, useEffect } from "react";
import { Package, ShoppingCart } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { getProducts, getUserProfile } from "@/lib/firebase/firestore";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Product } from "@/types";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [firstName, setFirstName] = useState("");
  const { getTotalItems } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile.fullName) setFirstName(profile.fullName.trim().split(" ")[0]);
      else if (user.displayName) setFirstName(user.displayName.split(" ")[0]);
    });
  }, [user]);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const totalItems = getTotalItems();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Olá, {firstName || user?.displayName?.split(" ")[0] || "você"} 👋
            </p>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Catálogo
            </h1>
          </div>

          <button
            onClick={() => router.push("/cart")}
            className="relative p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors dark:shadow-blue-400"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Filtro de categorias */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Produtos */}
      <div className="flex-1 p-4">
        {loading ? (
          <PageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30 dark:opacity-20" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}