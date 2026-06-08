import type { OrderStatus } from "@/domain/enums";
import { DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS } from "@/domain/enums";
import type { DeliveryMethod } from "@/domain/enums";
import { formatCurrency, formatOrderNumber } from "./format";

export interface TicketOrder {
  orderNumber: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentMethod: string;
  cashAmount: number | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  comments: string | null;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions: string | null;
    configuration?: {
      toppings?: { name: string; isSelected: boolean }[];
      addons?: { name: string; quantity: number }[];
    };
  }[];
}

export function printOrderTicket(order: TicketOrder, businessName: string) {
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pedido ${formatOrderNumber(order.orderNumber)}</title>
<style>
  body { font-family: monospace; font-size: 12px; max-width: 280px; margin: 0 auto; padding: 8px; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 8px; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; }
  .item { margin-bottom: 6px; }
  .muted { color: #444; font-size: 11px; }
  @media print { body { margin: 0; } }
</style></head><body>
  <h1>${businessName}</h1>
  <p class="row"><span>Pedido #</span><strong>${formatOrderNumber(order.orderNumber)}</strong></p>
  <p class="row"><span>Fecha</span><span>${new Date(order.createdAt).toLocaleString("es-MX")}</span></p>
  <p class="row"><span>Estado</span><span>${ORDER_STATUS_LABELS[order.status]}</span></p>
  <hr>
  <p><strong>${order.customerName ?? "—"}</strong></p>
  <p class="muted">${order.customerPhone ?? ""}</p>
  <p class="muted">${DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
  ${order.customerAddress ? `<p class="muted">${order.customerAddress}</p>` : ""}
  <hr>
  ${order.items
    .map(
      (item) => `
    <div class="item">
      <div class="row"><span>${item.quantity}x ${item.productName}</span><span>${formatCurrency(item.lineTotal)}</span></div>
      ${item.specialInstructions ? `<p class="muted">* ${item.specialInstructions}</p>` : ""}
    </div>`
    )
    .join("")}
  <hr>
  <p class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></p>
  ${order.discountAmount > 0 ? `<p class="row"><span>Descuento</span><span>-${formatCurrency(order.discountAmount)}</span></p>` : ""}
  <p class="row"><strong>Total</strong><strong>${formatCurrency(order.total)}</strong></p>
  <p class="muted">Pago: ${order.paymentMethod === "cash" ? `Efectivo ${order.cashAmount ? formatCurrency(order.cashAmount) : ""}` : "Transferencia"}</p>
  ${order.comments ? `<p class="muted">Notas: ${order.comments}</p>` : ""}
  <hr><p style="text-align:center">¡Gracias!</p>
</body></html>`;

  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}
