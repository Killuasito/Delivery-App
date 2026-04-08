"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllOrders, updateOrderStatus,
  getProducts, addProduct, deleteProduct,
} from "@/lib/firebase/firestore";
import { Order, Product } from "@/types";
import { useRouter } from "next/navigation";
import { ShieldAlert, RefreshCw, Plus, Trash2, ChevronUp } from "lucide-react";

const ADMIN_EMAIL = "aquasferium@gmail.com";

const STATUS_OPTIONS: Order["status"][] = ["pendente", "confirmado", "entregue", "cancelado"];

const STATUS_STYLES: Record<Order["status"], string> = {
  pendente:   "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  entregue:   "bg-green-100 text-green-700",
  cancelado:  "bg-red-100 text-red-700",
};

const EMPTY_FORM = { name: "", description: "", price: "", imageUrl: "", category: "", unit: "un" };

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [tab, setTab] = useState<"orders" | "products">("orders");

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/catalog");
  }, [loading, isAdmin, router]);

  const loadOrders = async () => {
    setFetchingOrders(true);
    try { setOrders(await getAllOrders()); }
    finally { setFetchingOrders(false); }
  };

  const loadProducts = async () => {
    setFetchingProducts(true);
    try { setProducts(await getProducts()); }
    finally { setFetchingProducts(false); }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadOrders();
    loadProducts();
  }, [isAdmin]);

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } finally { setUpdating(null); }
  };

  const handleAddProduct = async () => {
    if (!form.name || !form.price || !form.category || !form.unit) return;
    setSaving(true);
    try {
      const newProduct: Omit<Product, "id"> = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price.replace(",", ".")),
        imageUrl: form.imageUrl.trim() ||
          `https://placehold.co/400x300/e8f0fe/2563eb?text=${encodeURIComponent(form.name.trim())}`,
        category: form.category.trim(),
        unit: form.unit.trim(),
      };
      const id = await addProduct(newProduct);
      setProducts((prev) => [...prev, { id, ...newProduct }]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remover este produto?")) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally { setDeletingId(null); }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  if (loading || !isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Admin</h1>
        </div>
        <button
          onClick={() => tab === "orders" ? loadOrders() : loadProducts()}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={18} className={(fetchingOrders && tab === "orders") || (fetchingProducts && tab === "products") ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 gap-6">
        {(["orders", "products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-500" : "border-transparent text-gray-400 dark:text-gray-500"}`}>
            {t === "orders" ? "Pedidos" : "Produtos"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* ORDERS */}
        {tab === "orders" && (
          fetchingOrders ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhum pedido encontrado.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 break-all">{order.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{order.userEmail}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{order.deliveryAddress}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entrega: {order.deliveryDate} · {order.paymentMethod}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {order.items.map((item, i) => (
                    <span key={i} className="block">{item.quantity}× {item.product.name}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-gray-800">
                    R$ {order.totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex gap-2 flex-wrap pt-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} disabled={order.status === s || updating === order.id}
                      onClick={() => handleStatusChange(order.id!, s)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        order.status === s
                          ? `${STATUS_STYLES[s]} border-transparent font-semibold`
                          : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <>
            <button
              onClick={() => { setShowForm((v) => !v); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white font-medium text-sm shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors dark:shadow-blue-400"
            >
              {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
              {showForm ? "Cancelar" : "Adicionar Produto"}
            </button>

            {showForm && (
              <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-blue-100 dark:border-blue-900 shadow-sm space-y-3">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Novo Produto</h2>
                {[
                  { key: "name",        label: "Nome *",        placeholder: "Ex: Arroz Integral" },
                  { key: "description", label: "Descrição",     placeholder: "Ex: Pacote 5kg" },
                  { key: "price",       label: "Preço (R$) *",  placeholder: "Ex: 29,90" },
                  { key: "category",    label: "Categoria *",   placeholder: "Ex: Grãos" },
                  { key: "imageUrl",    label: "URL da imagem", placeholder: "https://... (opcional)" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</label>
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Unidade *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {["un", "kg", "cx", "L", "g"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleAddProduct}
                  disabled={saving || !form.name || !form.price || !form.category}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {saving ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            )}

            {fetchingProducts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-3 animate-pulse flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">Nenhum produto cadastrado.</p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl bg-gray-100 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{product.category} · {product.unit}</p>
                    <p className="text-sm font-bold text-blue-600">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={deletingId === product.id}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
