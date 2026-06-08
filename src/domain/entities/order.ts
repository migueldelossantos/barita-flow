import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from "../enums";

export interface CartToppingSelection {
  name: string;
  isSelected: boolean;
  mode: string;
}

export interface CartAddonSelection {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  toppings: CartToppingSelection[];
  addons: CartAddonSelection[];
  specialInstructions: string;
}

export interface CreateOrderPayload {
  companyId: string;
  deliveryMethod: DeliveryMethod;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerLat?: number;
  customerLng?: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  couponCode?: string;
  discountAmount: number;
  subtotal: number;
  total: number;
  comments?: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  companyId: string;
  orderNumber: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  createdAt: string;
}
