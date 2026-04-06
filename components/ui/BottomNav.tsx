"use client";
import { usePathname, useRouter } from "next/navigation";
import { Package, ShoppingCart, UserCircle, ShieldAlert } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_EMAIL = "aquasferium@gmail.com";

const BASE_NAV = [
  { label: "Catálogo", icon: Package,      href: "/catalog" },
  { label: "Carrinho", icon: ShoppingCart, href: "/cart"    },
  { label: "Perfil",   icon: UserCircle,   href: "/profile" },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { user } = useAuth();

  const NAV_ITEMS = user?.email === ADMIN_EMAIL
    ? [...BASE_NAV, { label: "Admin", icon: ShieldAlert, href: "/admin" }]
    : BASE_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg max-w-lg mx-auto">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href;
          const isCart = href === "/cart";

          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                isActive ? "text-blue-500" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}


      </div>
    </nav>
  );
};