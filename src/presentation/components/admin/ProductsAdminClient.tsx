"use client";

import { deleteProduct, toggleProductActive } from "@/app/actions/admin";
import type { Category, Product, ProductTopping, ProductVariant } from "@/domain/entities/product";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { Ban, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ProductFormModal } from "./ProductFormModal";

export function ProductsAdminClient() {
  const { companyId, loading: ctxLoading } = useCompany();
  const [products, setProducts] = useState<
    (Product & {variants: ProductVariant[], toppings: ProductTopping[]; categoryName?: string })[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<
    (Product & {variants: ProductVariant[], toppings: ProductTopping[] }) | null
  >(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const supabase = createClient();

    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name)")
        .eq("company_id", companyId)
        .order("name"),
      supabase
        .from("categories")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order"),
    ]);

    const withToppings = await Promise.all(
      (prods ?? []).map(async (p) => {
        const [{ data: tops }, { data: vars }] = await Promise.all([
          supabase
            .from("product_toppings")
            .select("*")
            .eq("product_id", p.id)
            .order("sort_order"),
          supabase
            .from("product_variants")
            .select("*")
            .eq("product_id", p.id)
            .order("sort_order"),
        ])
        const cat = p.categories as { name: string } | null;
        return {
          id: p.id,
          companyId: p.company_id,
          categoryId: p.category_id,
          code: p.code,
          name: p.name,
          description: p.description,
          price: Number(p.price || (vars || [])[0]?.price),
          imageUrl: p.image_url,
          isActive: p.is_active,
          isBestseller: p.is_bestseller,
          salesCount: p.sales_count,
          categoryName: cat?.name,
          variants: (vars ?? []).map((v) => ({
            id: v.id,
            productId: v.product_id,
            name: v.name,
            price: Number(v.price),
          })),
          toppings: (tops ?? []).map((t) => ({
            id: t.id,
            productId: t.product_id,
            name: t.name,
            mode: t.mode,
            sortOrder: t.sort_order,
            variantId: t.variant_id,
            maxSelectable: t.max_selectable,
          })),
        };
      })
    );

    setProducts(withToppings);
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
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (ctxLoading || !companyId) {
    return <p className="text-gray-500">Cargando empresa...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button
          variant="green"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Sin productos
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b ${!p.isActive ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.categoryName ?? "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-brand-blue"
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-red-500"
                        onClick={async () => {
                          if (!confirm("¿Eliminar producto?")) return;
                          await deleteProduct(companyId, p.id);
                          load();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-orange-500"
                        title={p.isActive ? "Desactivar" : "Activar"}
                        onClick={async () => {
                          await toggleProductActive(
                            companyId,
                            p.id,
                            !p.isActive
                          );
                          load();
                        }}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={companyId}
        categories={categories}
        product={editing}
        existingCodes={products.map((p) => p.code)}
        onSaved={load}
      />
    </div>
  );
}
