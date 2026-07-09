"use client";

import { advanceOrderStatus } from "@/app/actions/admin";
import type { OrderStatus } from "@/domain/enums";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/domain/enums";
import { formatOrderNumber } from "@/lib/format";
import { printOrderTicket } from "@/lib/print-ticket";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { ArrowRight, Eye, Plus, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PaginationControls from "@/presentation/components/ui/PaginatorComponent";
import { usePagination } from "@/presentation/hooks/usePagination";
import { Button } from "../ui/Button";
import {
  OrderDetailModal,
  type OrderDetail,
} from "./OrderDetailModal";

function nextStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_SEQUENCE.indexOf(current);
  if (index < 0 || index >= ORDER_STATUS_SEQUENCE.length - 1) return null;
  return ORDER_STATUS_SEQUENCE[index + 1];
}

export function OrdersAdminClient() {
  const router = useRouter();
  const { companyId, company, loading: ctxLoading } = useCompany();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const { currentData, currentPage, totalPages, setCurrentPage } = usePagination(
    orders,
    10
  );

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
      (rows ?? []).map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        return {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          deliveryMethod: order.delivery_method,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          customerAddress: order.customer_address,
          paymentMethod: order.payment_method,
          cashAmount: order.cash_amount ? Number(order.cash_amount) : null,
          subtotal: Number(order.subtotal),
          discountAmount: Number(order.discount_amount),
          total: Number(order.total),
          comments: order.comments,
          couponCode: order.coupon_code,
          createdAt: order.created_at,
          items: (items ?? []).map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            lineTotal: Number(item.line_total),
            specialInstructions: item.special_instructions,
            configuration: item.configuration as Record<string, unknown>,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Ordenes</h1>
        <Button
          type="button"
          variant="blue"
          onClick={() => router.push("/admin/dashboard/orders/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva orden
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Telefono</th>
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
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Sin pedidos
                </td>
              </tr>
            ) : (
              currentData.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-3 font-mono">
                    {formatOrderNumber(order.orderNumber)}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">{order.customerName ?? "—"}</td>
                  <td className="px-4 py-3">{order.customerPhone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="p-1 hover:text-gray-800"
                        title="Imprimir ticket"
                        onClick={() =>
                          printOrderTicket(order, company?.name ?? "Negocio")
                        }
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:text-brand-blue"
                        onClick={() => setDetail(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {nextStatus(order.status) && (
                        <button
                          type="button"
                          className="p-1 hover:text-brand-green"
                          title="Avanzar pedido"
                          onClick={() => handleAdvance(order)}
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

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <OrderDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        order={detail}
      />
    </div>
  );
}
