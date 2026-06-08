"use client";

import { formatCurrency } from "@/lib/format";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { useEffect, useState } from "react";

export function DashboardStatsClient() {
  const { companyId, loading: ctxLoading } = useCompany();
  const [weekSales, setWeekSales] = useState<{ day: string; total: number }[]>([]);
  const [topProducts, setTopProducts] = useState<
    { name: string; sales: number }[]
  >([]);

  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      const supabase = createClient();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("company_id", companyId)
        .gte("created_at", start.toISOString())
        .neq("status", "open");

      const days = ["D", "L", "M", "X", "J", "V", "S"];
      const totals = Array(7).fill(0);
      const labels: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
      }

      (orders ?? []).forEach((o) => {
        const d = new Date(o.created_at);
        const diff = Math.floor(
          (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff >= 0 && diff < 7) {
          totals[diff] += Number(o.total);
        }
      });

      setWeekSales(
        labels.map((day, i) => ({ day, total: totals[i] }))
      );

      const { data: products } = await supabase
        .from("products")
        .select("name, sales_count")
        .eq("company_id", companyId)
        .order("sales_count", { ascending: false })
        .limit(10);

      setTopProducts(
        (products ?? []).map((p) => ({
          name: p.name,
          sales: p.sales_count,
        }))
      );
    };

    load();
  }, [companyId]);

  if (ctxLoading) return <p className="text-gray-500">Cargando...</p>;

  const maxSale = Math.max(...weekSales.map((d) => d.total), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Ventas de la semana</h2>
          <div className="flex h-40 items-end gap-2">
            {weekSales.map(({ day, total }) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-blue transition-all"
                  style={{
                    height: `${Math.max(8, (total / maxSale) * 100)}%`,
                    minHeight: total > 0 ? 12 : 4,
                  }}
                  title={formatCurrency(total)}
                />
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Top 10 productos más vendidos</h2>
          <ul className="space-y-2 text-sm">
            {topProducts.length === 0 ? (
              <li className="text-gray-500">Sin datos aún</li>
            ) : (
              topProducts.map((p, i) => (
                <li key={p.name} className="flex justify-between border-b py-2">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-medium">{p.sales}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
