"use client";

import { deleteCategory } from "@/app/actions/admin";
import type { Category } from "@/domain/entities/product";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { CategoryFormModal } from "./CategoryFormModal";

export function CategoriesAdminClient() {
  const { companyId, loading: ctxLoading } = useCompany();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const supabase = createClient();

    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order");

    const { data: prods } = await supabase
      .from("products")
      .select("category_id")
      .eq("company_id", companyId);

    const counts: Record<string, number> = {};
    (prods ?? []).forEach((p) => {
      if (p.category_id) {
        counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      }
    });

    setCategories(
      (cats ?? []).map((c) => ({
        id: c.id,
        companyId: c.company_id,
        name: c.name,
        shortName: c.short_name,
        description: c.description,
        sortOrder: c.sort_order,
      }))
    );
    setProductCounts(counts);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (ctxLoading || !companyId) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button
          variant="green"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Corto</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.shortName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">{productCounts[c.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="p-1 hover:text-brand-blue"
                        onClick={() => {
                          setEditing(c);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:text-red-500 disabled:opacity-30"
                        disabled={(productCounts[c.id] ?? 0) > 0}
                        title={
                          (productCounts[c.id] ?? 0) > 0
                            ? "Tiene productos ligados"
                            : "Eliminar"
                        }
                        onClick={async () => {
                          if (!confirm("¿Eliminar categoría?")) return;
                          try {
                            await deleteCategory(companyId, c.id);
                            load();
                          } catch (e) {
                            alert(
                              e instanceof Error ? e.message : "Error"
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={companyId}
        category={editing}
        onSaved={load}
      />
    </div>
  );
}
