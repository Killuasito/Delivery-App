"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, MapPin, CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/lib/firebase/firestore";
import { CartItemCard } from "./CartItem";
import { DatePicker } from "./DatePicker";
import { useRouter } from "next/navigation";
import { AddressData } from "@/types";

const PAYMENT_OPTIONS = ["Pix", "Cartão de Crédito", "Cartão de Débito"];

/** Calcula o frete com base no prefixo do CEP de destino.
 *  Origem: São Roque/SP (181xx) */
const getDeliveryFee = (cep: string): number => {
  const digits = cep.replace(/\D/g, "");
  if (digits.length < 5) return 0;
  const prefix = parseInt(digits.slice(0, 5), 10);
  if (prefix >= 18100 && prefix <= 18199) return 6;    // São Roque
  if (prefix >= 18000 && prefix <= 18999) return 10;   // Região de Sorocaba
  if (prefix >= 1000  && prefix <= 19999) return 15;   // Interior SP
  if (prefix >= 1     && prefix <= 99999) return 20;   // Demais estados
  return 20;
};

const EMPTY_ADDRESS: AddressData = {
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", localidade: "", uf: "",
};

const addressToString = (a: AddressData) =>
  `${a.logradouro}, ${a.numero}${a.complemento ? " - " + a.complemento : ""}, ${a.bairro}, ${a.localidade}/${a.uf}, CEP ${a.cep}`;

export const CartSummary = () => {
  const { items, getTotalPrice, getTotalItems } = useCartStore();
  const { checkout, status, orderId, error, reset } = useCheckout();
  const { user } = useAuth();
  const router = useRouter();

  const [deliveryDate, setDeliveryDate] = useState("");
  const [address, setAddress]           = useState<AddressData>(EMPTY_ADDRESS);
  const [savedAddress, setSavedAddress] = useState<AddressData | null>(null);
  const [cepLoading, setCepLoading]     = useState(false);
  const [cepError, setCepError]         = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phone, setPhone]               = useState("");
  const [formErrors, setFormErrors]     = useState<{ date?: string; address?: string; payment?: string; phone?: string }>({});

  const deliveryFee = getDeliveryFee(address.cep);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile.address.logradouro) {
        setSavedAddress(profile.address);
        setAddress(profile.address);
      }
      if (profile.payment) setPaymentMethod(profile.payment);
      if (profile.phone) setPhone(profile.phone);
    });
  }, [user]);

  const fetchCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setAddress((prev) => ({
          ...prev,
          cep: data.cep ?? cep,
          logradouro: data.logradouro ?? "",
          bairro:     data.bairro     ?? "",
          localidade: data.localidade ?? "",
          uf:         data.uf         ?? "",
        }));
      }
    } catch {
      setCepError("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const validate = () => {
    const errors: { date?: string; address?: string; payment?: string; phone?: string } = {};
    if (!deliveryDate) errors.date = "Selecione uma data de entrega.";
    if (!address.logradouro || !address.numero)
      errors.address = "Preencha o endereço completo.";
    if (!paymentMethod)
      errors.payment = "Selecione um método de pagamento.";
    if (!phone)
      errors.phone = "Cadastre seu telefone no perfil antes de finalizar o pedido.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    if (!user || !validate()) return;
    await checkout({
      userId:          user.uid,
      userEmail:       user.email ?? "",
      deliveryDate,
      deliveryAddress: addressToString(address),
      paymentMethod,
      totalPrice: getTotalPrice() + deliveryFee,
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pedido Confirmado!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Seu pedido foi registrado com sucesso.</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
          ID: {orderId}
        </p>
        <button
          onClick={() => { reset(); router.push("/catalog"); }}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Continuar Comprando
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center">
          <ShoppingBag size={28} className="text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Seu carrinho está vazio</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">Adicione produtos do catálogo para continuar.</p>
        <button
          onClick={() => router.push("/catalog")}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
        >
          Ver Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-44">
      <div className="space-y-2">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ShoppingBag size={18} className="text-blue-600" />
          Itens ({getTotalItems()})
        </h2>
        {items.map((item) => (
          <CartItemCard key={item.product.id} item={item} />
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <MapPin size={16} className="text-blue-600" />
          Endereço de Entrega
        </label>
        {savedAddress && (
          <button
            type="button"
            onClick={() => {
              setAddress(savedAddress);
              setCepError("");
              setFormErrors((p) => ({ ...p, address: undefined }));
            }}
            className="w-full text-left bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl px-3 py-2.5 flex items-start gap-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Usar endereço do perfil</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 truncate">{addressToString(savedAddress)}</p>
            </div>
          </button>
        )}
        <div className="relative">
          <input
            value={address.cep}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 8);
              setAddress((p) => ({ ...p, cep: v }));
              setCepError("");
              setFormErrors((p) => ({ ...p, address: undefined }));
              if (v.length === 8) fetchCep(v);
            }}
            placeholder="CEP (somente números)"
            inputMode="numeric"
            maxLength={8}
            className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              formErrors.address ? "border-red-400 bg-red-50" : "border-gray-200 dark:border-gray-600"
            }`}
          />
          {cepLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">...</span>
          )}
        </div>
        {cepError && <p className="text-xs text-red-500">{cepError}</p>}

        {(address.logradouro !== "" || (address.cep.length === 8 && !cepLoading && !cepError)) && (
          <div className="space-y-2">
            <input
              value={address.logradouro}
              onChange={(e) => setAddress((p) => ({ ...p, logradouro: e.target.value }))}
              placeholder="Rua / Avenida"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={address.numero}
                onChange={(e) => setAddress((p) => ({ ...p, numero: e.target.value }))}
                placeholder="Número"
                className="text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={address.complemento}
                onChange={(e) => setAddress((p) => ({ ...p, complemento: e.target.value }))}
                placeholder="Complemento"
                className="text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <input
              value={address.bairro}
              onChange={(e) => setAddress((p) => ({ ...p, bairro: e.target.value }))}
              placeholder="Bairro"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                value={address.localidade}
                onChange={(e) => setAddress((p) => ({ ...p, localidade: e.target.value }))}
                placeholder="Cidade"
                className="col-span-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={address.uf}
                onChange={(e) => setAddress((p) => ({ ...p, uf: e.target.value.slice(0, 2).toUpperCase() }))}
                placeholder="UF"
                maxLength={2}
                className="text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
              />
            </div>
          </div>
        )}
        {formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}
      </div>

      {/* Método de Pagamento */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-600" />
          Pagamento
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setPaymentMethod(opt); setFormErrors((p) => ({ ...p, payment: undefined })); }}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                paymentMethod === opt
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                  : formErrors.payment
                  ? "border-red-300 text-gray-600 bg-red-50"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 bg-white dark:bg-gray-800"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {formErrors.payment && <p className="text-xs text-red-500">{formErrors.payment}</p>}
      </div>

      <DatePicker value={deliveryDate} onChange={setDeliveryDate} error={formErrors.date} />

      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Subtotal ({getTotalItems()} itens)</span>
          <span>R$ {getTotalPrice().toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Entrega</span>
          {address.cep.replace(/\D/g, "").length === 8 ? (
            <span className="font-medium text-gray-800 dark:text-gray-100">
              R$ {deliveryFee.toFixed(2).replace(".", ",")}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic text-xs self-center">informe o CEP</span>
          )}
        </div>
        <div className="border-t border-blue-100 dark:border-blue-900 pt-2 flex justify-between font-bold text-gray-800 dark:text-gray-100">
          <span>Total</span>
          <span className="text-blue-600 dark:text-blue-400 text-lg">
            R$ {(getTotalPrice() + (address.cep.replace(/\D/g, "").length === 8 ? deliveryFee : 0)).toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {status === "error" && error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {formErrors.phone && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-700">
            {formErrors.phone}{" "}
            <button
              className="font-semibold underline"
              onClick={() => router.push("/profile")}
            >
              Ir para o Perfil
            </button>
          </p>
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg max-w-lg mx-auto">
        <button
          onClick={handleCheckout}
          disabled={status === "loading"}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-md shadow-blue-200 dark:shadow-blue-400"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <ShoppingBag size={20} />
              Finalizar Pedido
            </>
          )}
        </button>
      </div>
    </div>
  );
};