export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  unit: string; // "kg", "un", "cx"
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  deliveryDate: string; // ISO string
  deliveryAddress: string;
  paymentMethod: string;
  totalPrice: number;
  status: "pendente" | "confirmado" | "entregue" | "cancelado";
  createdAt: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AddressData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface UserProfile {
  address: AddressData;
  payment: string;
}