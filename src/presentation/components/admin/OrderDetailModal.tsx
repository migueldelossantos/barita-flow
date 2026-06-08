"use client";

import type { OrderStatus, DeliveryMethod } from "@/domain/enums";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
} from "@/domain/enums";
import { formatCurrency, formatOrderNumber } from "@/lib/format";
import { Modal } from "../ui/Modal";

export interface OrderDetail {
  id: string;
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
  couponCode: string | null;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions: string | null;
    configuration?: Record<string, unknown>;
  }[];
}

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderDetail | null;
}

export function OrderDetailModal({
  open,
  onClose,
  order,
}: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Pedido #${formatOrderNumber(order.orderNumber)}`}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue">
            {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
          </span>
        </div>

        <div>
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-gray-600">{order.customerPhone}</p>
          {order.customerAddress && (
            <p className="text-gray-600">{order.customerAddress}</p>
          )}
        </div>

        <ul className="divide-y rounded-lg border">
          {order.items.map((item, i) => (
            <li key={i} className="px-3 py-2">
              <div className="flex justify-between">
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
              {item.specialInstructions && (
                <p className="text-xs text-gray-500">{item.specialInstructions}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="space-y-1 rounded-lg bg-gray-50 p-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-brand-green">
              <span>Descuento {order.couponCode && `(${order.couponCode})`}</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Pago:{" "}
            {order.paymentMethod === "cash"
              ? `Efectivo ${order.cashAmount ? formatCurrency(order.cashAmount) : ""}`
              : "Transferencia"}
          </p>
        </div>

        {order.comments && (
          <p className="text-gray-600">
            <strong>Comentarios:</strong> {order.comments}
          </p>
        )}

        <p className="text-xs text-gray-400">
          {new Date(order.createdAt).toLocaleString("es-MX")}
        </p>
      </div>
    </Modal>
  );
}
