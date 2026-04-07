import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Order, CartItem, UserProfile, AddressData, Product } from "@/types";

const EMPTY_ADDRESS: AddressData = {
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", localidade: "", uf: "",
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return { address: EMPTY_ADDRESS, payment: "", phone: "" };
  const data = snap.data();
  return {
    address: data.address ?? EMPTY_ADDRESS,
    payment: data.payment ?? "",
    phone: data.phone ?? "",
  };
};

export const saveUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  await setDoc(doc(db, "users", userId), profile, { merge: true });
};

export const saveFcmToken = async (userId: string, token: string): Promise<void> => {
  await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true });
};

export const createOrder = async (orderData: {
  userId: string;
  userEmail: string;
  items: CartItem[];
  deliveryDate: string;
  deliveryAddress: string;
  paymentMethod: string;
  totalPrice: number;
}): Promise<string> => {
  const order: Omit<Order, "id"> = {
    ...orderData,
    status: "pendente",
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt:
      doc.data().createdAt?.toDate?.()?.toISOString() ?? doc.data().createdAt,
  })) as Order[];
};

export const subscribeUserOrders = (
  userId: string,
  onUpdate: (orders: Order[], changedId: string | null) => void
): (() => void) => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  let firstLoad = true;

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt:
        d.data().createdAt?.toDate?.()?.toISOString() ?? d.data().createdAt,
    })) as Order[];

    let changedId: string | null = null;
    if (!firstLoad) {
      const modified = snapshot.docChanges().find((c) => c.type === "modified");
      if (modified) changedId = modified.doc.id;
    }
    firstLoad = false;

    onUpdate(orders, changedId);
  });
};

export const getAllOrders = async (): Promise<Order[]> => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt:
      doc.data().createdAt?.toDate?.()?.toISOString() ?? doc.data().createdAt,
  })) as Order[];
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"]
): Promise<void> => {
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, "orders", orderId), { status });
};

// ── Products ──────────────────────────────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, "products"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
};

export const addProduct = async (
  product: Omit<Product, "id">
): Promise<string> => {
  const ref = await addDoc(collection(db, "products"), product);
  return ref.id;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, "products", productId));
};