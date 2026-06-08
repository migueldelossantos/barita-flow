import type { CartItem } from "@/domain/entities/order";
import type { DeliveryMethod, PaymentMethod } from "@/domain/enums";
import { DELIVERY_METHOD_LABELS } from "@/domain/enums";
import { formatCurrency, formatOrderNumber } from "./format";

interface WhatsAppMessageParams {
  businessPhone: string;
  customerName: string;
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  address?: string;
  deliveryMethod: DeliveryMethod;
}

function buildItemsList(items: CartItem[]): string {
  return items
    .map((item) => {
      const toppings = item.toppings
        .filter((t) => t.isSelected)
        .map((t) => t.name)
        .join(", ");
      const addons = item.addons
        .filter((a) => a.quantity > 0)
        .map((a) => `${a.quantity}x ${a.name}`)
        .join(", ");
      const extras = [toppings, addons].filter(Boolean).join(" | ");
      const comment = item.specialInstructions
        ? `\n  _Nota: ${item.specialInstructions}_`
        : "";
      return `• ${item.quantity}x ${item.productName}${extras ? ` (${extras})` : ""}${comment}`;
    })
    .join("\n");
}

export function buildOrderWhatsAppMessage(params: WhatsAppMessageParams): string {
  const paymentLine =
    params.paymentMethod === "cash"
      ? `Pagaré con: ${formatCurrency(params.cashAmount ?? params.total)} en efectivo`
      : "Pagaré con: transferencia bancaria";

  const addressLine =
    params.deliveryMethod === "delivery" && params.address
      ? `Mi dirección: ${params.address}`
      : `Entrega: ${DELIVERY_METHOD_LABELS[params.deliveryMethod]}`;

  return `Hola, mi nombre es *${params.customerName}*, este es mi pedido:\%0D\%0A
*Número de pedido*: ${formatOrderNumber(params.orderNumber)}\%0D\%0A\%0D\%0A
${buildItemsList(params.items)}\%0D\%0A\%0D\%0A
*Subtotal: ${formatCurrency(params.subtotal)}*\%0D\%0A
*Total: ${formatCurrency(params.total)}*\%0D\%0A\%0D\%0A
${paymentLine}\%0D\%0A
${addressLine}\%0D\%0A\%0D\%0A
${params.customerName}, tu pedido está siendo preparado.\%0D\%0A\%0D\%0A
*Gracias por su compra.*`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}
