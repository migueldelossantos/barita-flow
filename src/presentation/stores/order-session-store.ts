import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/domain/entities/order";
import type { DeliveryMethod, OrderStatus } from "@/domain/enums";

interface CheckoutData {
  customerName: string;
  customerPhone: string;
  address: string;
  lat?: number;
  lng?: number;
  couponCode: string;
  discountAmount: number;
  paymentMethod: "cash" | "transfer";
  cashAmount: string;
  comments: string;
}

interface OrderSessionState {
  companyId: string | null;
  deliveryMethod: DeliveryMethod | null;
  orderStatus: OrderStatus;
  cart: CartItem[];
  checkout: CheckoutData;
  deliveryModalSeen: boolean;

  setCompanyId: (id: string) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setDeliveryModalSeen: (seen: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateCartItem: (id: string, item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setCheckout: (data: Partial<CheckoutData>) => void;
  cartTotal: () => number;
  resetSession: () => void;
}

const defaultCheckout: CheckoutData = {
  customerName: "",
  customerPhone: "",
  address: "",
  couponCode: "",
  discountAmount: 0,
  paymentMethod: "cash",
  cashAmount: "",
  comments: "",
};

export const useOrderSession = create<OrderSessionState>()(
  persist(
    (set, get) => ({
      companyId: null,
      deliveryMethod: null,
      orderStatus: "open",
      cart: [],
      checkout: defaultCheckout,
      deliveryModalSeen: false,

      setCompanyId: (id) => set({ companyId: id }),
      setDeliveryMethod: (method) => set({ deliveryMethod: method }),
      setDeliveryModalSeen: (seen) => set({ deliveryModalSeen: seen }),

      addToCart: (item) =>
        set((state) => ({ cart: [...state.cart, item] })),

      cartTotal: () => {
        return get().cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      },

      updateCartItem: (id, item) =>
        set((state) => ({
          cart: state.cart.map((c) => (c.id === id ? item : c)),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== id),
        })),

      clearCart: () => set({ cart: [], orderStatus: "open", deliveryMethod: null, checkout: defaultCheckout }),

      setCheckout: (data) =>
        set((state) => ({
          checkout: { ...state.checkout, ...data },
        })),

      resetSession: () =>
        set({
          deliveryMethod: null,
          orderStatus: "open",
          cart: [],
          checkout: defaultCheckout,
          deliveryModalSeen: false,
        }),
    }),
    {
      name: "baristaflow-order",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export function computeItemUnitPrice(
  basePrice: number,
  addons: { price: number; quantity: number }[]
): number {
  return (
    basePrice + addons.reduce((sum, a) => sum + a.price * a.quantity, 0)
  );
}
