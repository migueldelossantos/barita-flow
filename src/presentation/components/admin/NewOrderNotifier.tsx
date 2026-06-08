"use client";

import { createClient } from "@/infrastructure/supabase/client";
import { formatOrderNumber } from "@/lib/format";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Toast {
  id: string;
  orderNumber: number;
}

export function NewOrderNotifier() {
  const { companyId } = useCompany();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; order_number: number };
          setToasts((t) => [
            ...t,
            { id: row.id, orderNumber: row.order_number },
          ]);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nuevo pedido", {
              body: `Pedido #${formatOrderNumber(row.order_number)}`,
            });
          }
        }
      )
      .subscribe();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            router.push("/admin/dashboard/orders");
            setToasts((all) => all.filter((x) => x.id !== t.id));
          }}
          className="flex items-center gap-3 rounded-lg bg-brand-blue px-4 py-3 text-sm font-medium text-white shadow-lg animate-pulse"
        >
          <Bell className="h-5 w-5" />
          Nuevo pedido #{formatOrderNumber(t.orderNumber)}
        </button>
      ))}
      <button
        type="button"
        className="text-right text-xs text-gray-500 underline"
        onClick={() => setToasts([])}
      >
        Cerrar todas
      </button>
    </div>
  );
}
