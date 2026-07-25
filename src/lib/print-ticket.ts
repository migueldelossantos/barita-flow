import type { OrderStatus } from "@/domain/enums";
import { DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS } from "@/domain/enums";
import type { DeliveryMethod } from "@/domain/enums";
import QRCode from "qrcode";
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTicketHtml(order: TicketOrder, businessName: string, qrDataUrl: string) {
  const headerSeparator = '<div class="sep"></div>';
  const itemBlocks = order.items
    .map((item) => {
      const toppingNames = item.configuration?.toppings
        ? item.configuration.toppings
            .filter((topping) => topping.isSelected)
            .map((topping) => topping.name)
            .join(", ")
        : "";
      const addonNames = item.configuration?.addons?.length
        ? item.configuration.addons
            .map((addon) => `${addon.quantity}x ${addon.name}`)
            .join(", ")
        : "";

      return `
        <div class="item">
          <div class="row">
            <span>${escapeHtml(`${item.quantity}x ${item.productName}`)}</span>
            <span>${escapeHtml(formatCurrency(item.lineTotal))}</span>
          </div>
          ${toppingNames ? `<div class="muted">Toppings: ${escapeHtml(toppingNames)}</div>` : ""}
          ${addonNames ? `<div class="muted">Extras: ${escapeHtml(addonNames)}</div>` : ""}
          ${item.specialInstructions?.trim() ? `<div class="muted">Nota: ${escapeHtml(item.specialInstructions.trim())}</div>` : ""}
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pedido ${escapeHtml(formatOrderNumber(order.orderNumber))}</title>
  <style>
    @page { size: 56mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
      width: 56mm;
      padding: 2mm 1mm;
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }
    .ticket { width: 100%; }
    .center { text-align: center; }
    .title { font-size: 13px; font-weight: 800; margin-bottom: 2px; }
    .subtitle { font-size: 11px; margin-bottom: 3px; }
    .sep {
      border-top: 1px dashed #000;
      margin: 4px 0;
      width: 100%;
      height: 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 6px;
    }
    .row span:last-child {
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item { margin-bottom: 4px; }
    .muted {
      font-size: 10px;
      white-space: normal;
      overflow-wrap: anywhere;
      margin-top: 1px;
    }
    .body-text {
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qr {
      margin-top: 6px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qr img {
      display: inline-block;
      width: 34mm;
      height: 34mm;
      image-rendering: pixelated;
    }
    .caption {
      margin-top: 2px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <div class="title">${escapeHtml(businessName.toUpperCase())}</div>
      <div class="subtitle">Pedido #${escapeHtml(formatOrderNumber(order.orderNumber))}</div>
      <div class="subtitle">${escapeHtml(new Date(order.createdAt).toLocaleString("es-MX"))}</div>
    </div>
    ${headerSeparator}
    <div class="body-text">Cliente: ${escapeHtml(order.customerName ?? "—")}</div>
    <div class="body-text">Telefono: ${escapeHtml(order.customerPhone ?? "—")}</div>
    <div class="body-text">Entrega: ${escapeHtml(DELIVERY_METHOD_LABELS[order.deliveryMethod])}</div>
    ${order.customerAddress ? `<div class="body-text">Direccion: ${escapeHtml(order.customerAddress)}</div>` : ""}
    ${headerSeparator}
    <div class="body-text" style="font-weight:700;">ARTICULOS</div>
    ${itemBlocks}
    ${headerSeparator}
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(order.subtotal))}</span></div>
    ${order.discountAmount > 0 ? `<div class="row"><span>Descuento</span><span>-${escapeHtml(formatCurrency(order.discountAmount))}</span></div>` : ""}
    <div class="row" style="font-weight:700;"><span>Total</span><span>${escapeHtml(formatCurrency(order.total))}</span></div>
    <div class="body-text">Pago: ${escapeHtml(order.paymentMethod === "cash" ? "Efectivo" : "Transferencia")}</div>
    ${order.paymentMethod === "cash" && order.cashAmount ? `<div class="body-text">Recibido: ${escapeHtml(formatCurrency(order.cashAmount))}</div>` : ""}
    ${order.comments?.trim() ? `${headerSeparator}<div class="body-text">Comentarios:</div><div class="body-text">${escapeHtml(order.comments.trim())}</div>` : ""}
    ${headerSeparator}
    <div class="qr">
      <img src="${qrDataUrl}" alt="QR del menú" />
      <div class="caption">Escanea para abrir el menú</div>
    </div>
  </div>
</body>
</html>`;
}

export async function printOrderTicket(
  order: TicketOrder,
  businessName: string,
  menuUrl: string
) {
  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const html = buildTicketHtml(order, businessName, qrDataUrl);

  const win = window.open("", "_blank", "width=360,height=720");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 700);
}
