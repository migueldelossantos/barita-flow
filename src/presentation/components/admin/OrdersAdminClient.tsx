"use client";

import { advanceOrderStatus } from "@/app/actions/admin";
import type { OrderStatus } from "@/domain/enums";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/domain/enums";
import { formatOrderNumber } from "@/lib/format";
import { printOrderTicket } from "@/lib/print-ticket";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { ArrowRight, Eye, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  OrderDetailModal,
  type OrderDetail,
} from "./OrderDetailModal";

function nextStatus(current: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUS_SEQUENCE.indexOf(current);
  if (i < 0 || i >= ORDER_STATUS_SEQUENCE.length - 1) return null;
  return ORDER_STATUS_SEQUENCE[i + 1];
}

export function OrdersAdminClient() {
  const { companyId, company, loading: ctxLoading } = useCompany();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const supabase = createClient();

    const { data: rows } = await supabase
      .from("orders")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    const full: OrderDetail[] = await Promise.all(
      (rows ?? []).map(async (o) => {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", o.id);

        return {
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          deliveryMethod: o.delivery_method,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          paymentMethod: o.payment_method,
          cashAmount: o.cash_amount ? Number(o.cash_amount) : null,
          subtotal: Number(o.subtotal),
          discountAmount: Number(o.discount_amount),
          total: Number(o.total),
          comments: o.comments,
          couponCode: o.coupon_code,
          createdAt: o.created_at,
          items: (items ?? []).map((i) => ({
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            lineTotal: Number(i.line_total),
            specialInstructions: i.special_instructions,
            configuration: i.configuration as Record<string, unknown>,
          })),
        };
      })
    );

    setOrders(full);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!companyId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-orders-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `company_id=eq.${companyId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, load]);

  const handleAdvance = async (order: OrderDetail) => {
    const next = nextStatus(order.status);
    if (!next || !companyId) return;
    await advanceOrderStatus(companyId, order.id, next);
    load();
  };

  if (ctxLoading || !companyId) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Órdenes</h1>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Sin pedidos
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="px-4 py-3 font-mono">
                    {formatOrderNumber(o.orderNumber)}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(o.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">{o.customerName ?? "—"}</td>
                  <td className="px-4 py-3">{o.customerPhone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="p-1 hover:text-gray-800"
                        title="Imprimir ticket"
                        onClick={() =>
                          printOrderTicket(o, company?.name ?? "Negocio")
                        }
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:text-brand-blue"
                        onClick={() => setDetail(o)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {nextStatus(o.status) && (
                        <button
                          type="button"
                          className="p-1 hover:text-brand-green"
                          title="Avanzar pedido"
                          onClick={() => handleAdvance(o)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        order={detail}
      />
    </div>
  );
}
