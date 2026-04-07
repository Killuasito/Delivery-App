"use client";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  MapPin, CreditCard, ClipboardList, LogOut,
  Pencil, Check, X, Package, Clock, ChevronRight, Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, saveUserProfile, subscribeUserOrders } from "@/lib/firebase/firestore";
import { logOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { Order, AddressData } from "@/types";

const PAYMENT_OPTIONS = ["Pix", "Cartão de Crédito", "Cartão de Débito"];

const STATUS_STYLES: Record<Order["status"], { label: string; cls: string }> = {
  pendente:   { label: "Pendente",   cls: "bg-yellow-100 text-yellow-700" },
  confirmado: { label: "Confirmado", cls: "bg-blue-100 text-blue-700"   },
  entregue:   { label: "Entregue",   cls: "bg-green-100 text-green-700"  },
  cancelado:  { label: "Cancelado",  cls: "bg-red-100 text-red-700"      },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();


  const EMPTY_ADDRESS: AddressData = {
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "", localidade: "", uf: "",
  };

  const [address, setAddress]     = useState<AddressData>(EMPTY_ADDRESS);
  const [draft, setDraft]         = useState<AddressData>(EMPTY_ADDRESS);
  const [editingAddress, setEditingAddress] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError]     = useState("");

  const [payment, setPayment] = useState("");
  const [phone, setPhone]     = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft]     = useState("");

  const [orders, setOrders]              = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders]  = useState(true);
  const [toastOrderId, setToastOrderId]    = useState<string | null>(null);

  // Load preferences from Firestore
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      setAddress(profile.address);
      setPayment(profile.payment);
      setPhone(profile.phone ?? "");
    });
  }, [user]);

  // Load orders with real-time updates
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserOrders(user.uid, (updated, changedId) => {
      setOrders(updated);
      setLoadingOrders(false);
      if (changedId) {
        setToastOrderId(changedId);
        setTimeout(() => setToastOrderId(null), 4000);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const fetchCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setDraft((prev) => ({
          ...prev,
          cep: data.cep ?? cep,
          logradouro: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          localidade: data.localidade ?? "",
          uf: data.uf ?? "",
        }));
      }
    } catch {
      setCepError("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const saveAddress = () => {
    if (!user) return;
    saveUserProfile(user.uid, { address: draft });
    setAddress(draft);
    setEditingAddress(false);
    setCepError("");
  };

  const addressLabel = address.logradouro
    ? `${address.logradouro}${address.numero ? ", " + address.numero : ""}${address.complemento ? " – " + address.complemento : ""} · ${address.bairro} · ${address.localidade}/${address.uf}`
    : "";

  const selectPayment = (method: string) => {
    if (!user) return;
    saveUserProfile(user.uid, { payment: method });
    setPayment(method);
  };

  const savePhone = () => {
    if (!user) return;
    saveUserProfile(user.uid, { phone: phoneDraft });
    setPhone(phoneDraft);
    setEditingPhone(false);
  };

  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Status update toast */}
      {toastOrderId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Package size={15} />
          Seu pedido foi atualizado!
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Meu Perfil</h1>
        <ThemeToggle />
      </header>

      {/* User card */}
      <div className="bg-white dark:bg-gray-900 px-4 py-5 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md shadow-blue-100">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-100 truncate">
            {user?.displayName ?? "Usuário"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* ── Endereço padrão ──────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <MapPin size={15} className="text-blue-600" />
              Endereço Padrão
            </h2>
            {!editingAddress && (
              <button
                onClick={() => { setDraft(address); setCepError(""); setEditingAddress(true); }}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                <Pencil size={12} />
                {address.logradouro ? "Editar" : "Adicionar"}
              </button>
            )}
          </div>

          <div className="px-4 py-3">
            {editingAddress ? (
              <div className="space-y-2.5">
                {/* CEP */}
                <div className="relative">
                  <input
                    value={draft.cep}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setDraft((p) => ({ ...p, cep: v }));
                      setCepError("");
                      if (v.length === 8) fetchCep(v);
                    }}
                    placeholder="CEP (somente números)"
                    inputMode="numeric"
                    maxLength={8}
                    autoFocus
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">...</span>
                  )}
                </div>
                {cepError && <p className="text-xs text-red-500">{cepError}</p>}

                {/* Demais campos — só aparecem após CEP preenchido */}
                {draft.logradouro !== "" || (draft.cep.length === 8 && !cepLoading && !cepError) ? (
                  <>
                    <input
                      value={draft.logradouro}
                      onChange={(e) => setDraft((p) => ({ ...p, logradouro: e.target.value }))}
                      placeholder="Rua / Avenida"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={draft.numero}
                        onChange={(e) => setDraft((p) => ({ ...p, numero: e.target.value }))}
                        placeholder="Número"
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        value={draft.complemento}
                        onChange={(e) => setDraft((p) => ({ ...p, complemento: e.target.value }))}
                        placeholder="Complemento"
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <input
                      value={draft.bairro}
                      onChange={(e) => setDraft((p) => ({ ...p, bairro: e.target.value }))}
                      placeholder="Bairro"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={draft.localidade}
                        onChange={(e) => setDraft((p) => ({ ...p, localidade: e.target.value }))}
                        placeholder="Cidade"
                        className="col-span-2 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        value={draft.uf}
                        onChange={(e) => setDraft((p) => ({ ...p, uf: e.target.value.slice(0, 2).toUpperCase() }))}
                        placeholder="UF"
                        maxLength={2}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                      />
                    </div>
                  </>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveAddress}
                    disabled={!draft.logradouro || !draft.numero}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Check size={13} /> Salvar
                  </button>
                  <button
                    onClick={() => { setEditingAddress(false); setCepError(""); }}
                    className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-medium px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${addressLabel ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500 italic"}`}>
                {addressLabel || "Nenhum endereço salvo."}
              </p>
            )}
          </div>
        </section>

        {/* ── Pagamento padrão ─────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <CreditCard size={15} className="text-blue-600" />
              Pagamento Padrão
            </h2>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => selectPayment(opt)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                  payment === opt
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 bg-white dark:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
        {/* ── Telefone ────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Telefone</h2>
              {!phone && <span className="text-xs bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full">Obrigatório</span>}
            </div>
            <button onClick={() => { setPhoneDraft(phone); setEditingPhone(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Pencil size={14} className="text-gray-400" />
            </button>
          </div>
          <div className="px-4 py-3">
            {editingPhone ? (
              <div className="space-y-2">
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let masked = digits;
                    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                    setPhoneDraft(masked);
                  }}
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                />
                <div className="flex gap-2">
                  <button onClick={savePhone} className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg">
                    <Check size={13} /> Salvar
                  </button>
                  <button onClick={() => setEditingPhone(false)} className="flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : phone ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">{phone}</p>
            ) : (
              <button onClick={() => { setPhoneDraft(""); setEditingPhone(true); }} className="text-sm text-blue-600 font-semibold hover:underline">
                + Adicionar telefone
              </button>
            )}
          </div>
        </section>
        {/* ── Meus Pedidos ─────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
            <ClipboardList size={15} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Meus Pedidos</h2>
          </div>

          {/* Loading skeleton */}
          {loadingOrders && (
            <div className="p-4 space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingOrders && orders.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center px-4 space-y-3">
              <Package size={40} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Você ainda não fez nenhum pedido.</p>
              <button
                onClick={() => router.push("/catalog")}
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Ver Catálogo
              </button>
            </div>
          )}

          {/* Orders list */}
          {!loadingOrders && orders.length > 0 && (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {orders.map((order) => {
                const statusInfo = STATUS_STYLES[order.status];
                const deliveryDate = new Date(order.deliveryDate + "T12:00:00");

                return (
                  <div key={order.id} className={`px-4 py-3 space-y-2 transition-all duration-700 ${toastOrderId === order.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs">
                            R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          +{order.items.length - 3} outro(s) item(ns)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        Entrega:{" "}
                        <span className="font-medium text-gray-600 dark:text-gray-300 ml-0.5">
                          {deliveryDate.toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "long",
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-blue-600 text-sm">
                        R$ {order.totalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Logout ───────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-2 font-medium text-sm">
            <LogOut size={16} />
            Sair da conta
          </div>
          <ChevronRight size={16} className="opacity-40" />
        </button>
      </div>
    </div>
  );
}
