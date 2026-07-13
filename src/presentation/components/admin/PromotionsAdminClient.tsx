"use client";

import { deleteCoupon, saveCoupon } from "@/app/actions/admin";
import type { Product } from "@/domain/entities/product";
import { createClient } from "@/infrastructure/supabase/client";
import { formatCurrency } from "@/lib/format";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type DiscountType = "percent" | "amount";

type CouponRow = {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  productIds: string[];
};

type CouponFormState = {
  id: string | null;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  isActive: boolean;
  expiresAt: string;
  appliesToAllProducts: boolean;
  selectedProductIds: string[];
};

const defaultForm = (): CouponFormState => ({
  id: null,
  code: "",
  discountType: "percent",
  discountValue: "",
  isActive: true,
  expiresAt: "",
  appliesToAllProducts: true,
  selectedProductIds: [],
});

function formatCouponValue(coupon: CouponRow) {
  if (coupon.discountPercent !== null) {
    return `${coupon.discountPercent}%`;
  }
  if (coupon.discountAmount !== null) {
    return formatCurrency(Number(coupon.discountAmount));
  }
  return "—";
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX");
}

function CouponFormModal({
  open,
  onClose,
  onSaved,
  companyId,
  products,
  coupon,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  companyId: string;
  products: Product[];
  coupon: CouponRow | null;
}) {
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<CouponFormState>(defaultForm());

  useEffect(() => {
    if (!open) return;
    if (!coupon) {
      setForm(defaultForm());
      setSearchTerm("");
      return;
    }

    setForm({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountPercent !== null ? "percent" : "amount",
      discountValue:
        coupon.discountPercent !== null
          ? String(coupon.discountPercent)
          : String(coupon.discountAmount ?? ""),
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      appliesToAllProducts: coupon.productIds.length === 0,
      selectedProductIds: coupon.productIds,
    });
    setSearchTerm("");
  }, [coupon, open]);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, product.code].join(" ").toLowerCase().includes(normalized)
    );
  }, [products, searchTerm]);

  const toggleProduct = (productId: string) => {
    setForm((current) => ({
      ...current,
      selectedProductIds: current.selectedProductIds.includes(productId)
        ? current.selectedProductIds.filter((id) => id !== productId)
        : [...current.selectedProductIds, productId],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim()) {
      alert("Escribe un codigo de cupón");
      return;
    }

    if (form.discountType === "percent" && Number(form.discountValue) > 100) {
      alert("El porcentaje no puede ser mayor a 100");
      return;
    }

    if (!form.appliesToAllProducts && form.selectedProductIds.length === 0) {
      alert("Selecciona al menos un producto o marca el cupón para todos");
      return;
    }

    setSaving(true);
    try {
      await saveCoupon(companyId, {
        id: form.id ?? undefined,
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        isActive: form.isActive,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
        productIds: form.appliesToAllProducts ? [] : form.selectedProductIds,
      });
      onSaved();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo guardar el cupón");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={coupon ? "Editar cupón" : "Nuevo cupón"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Código</label>
          <input
            value={form.code}
            onChange={(e) =>
              setForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))
            }
            className="w-full rounded-lg border px-3 py-2 text-sm uppercase"
            placeholder="VERANO2026"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, discountType: "percent" }))}
            className={`rounded-xl border px-4 py-3 text-left ${
              form.discountType === "percent"
                ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <p className="font-medium">Porcentaje</p>
          </button>
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, discountType: "amount" }))}
            className={`rounded-xl border px-4 py-3 text-left ${
              form.discountType === "amount"
                ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <p className="font-medium">Monto fijo</p>
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {form.discountType === "percent" ? "Porcentaje de descuento" : "Monto de descuento"}
          </label>
          <input
            type="number"
            min="0"
            step={form.discountType === "percent" ? "0.01" : "1"}
            value={form.discountValue}
            onChange={(e) =>
              setForm((current) => ({ ...current, discountValue: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder={form.discountType === "percent" ? "10" : "50"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Expiración</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) =>
              setForm((current) => ({ ...current, expiresAt: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((current) => ({ ...current, isActive: e.target.checked }))
            }
          />
          Cupón activo
        </label>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.appliesToAllProducts}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  appliesToAllProducts: e.target.checked,
                }))
              }
            />
            Aplica a todos los productos
          </label>

          {!form.appliesToAllProducts && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Buscar producto"
                />
              </label>

              <div className="max-h-64 overflow-y-auto rounded-xl border bg-white">
                {filteredProducts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No hay productos
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.code}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.selectedProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                      />
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="green" fullWidth disabled={saving}>
            {saving ? "Guardando..." : coupon ? "Actualizar" : "Crear cupón"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PromotionsAdminClient() {
  const { companyId, loading: ctxLoading } = useCompany();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CouponRow | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const supabase = createClient();

    const [{ data: productRows }, { data: couponRows }] = await Promise.all([
      supabase
        .from("products")
        .select("id, company_id, category_id, code, name, description, price, image_url, is_active, is_bestseller, sales_count")
        .eq("company_id", companyId)
        .order("name"),
      supabase
        .from("coupons")
        .select("id, code, discount_percent, discount_amount, is_active, expires_at, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ]);

    const couponIds = (couponRows ?? []).map((coupon) => coupon.id);
    const { data: linkRows } = couponIds.length
      ? await supabase
          .from("coupon_products")
          .select("coupon_id, product_id")
          .in("coupon_id", couponIds)
      : { data: [] as { coupon_id: string; product_id: string }[] };

    setProducts(
      (productRows ?? []).map((product) => ({
        id: product.id,
        companyId: product.company_id,
        categoryId: product.category_id,
        code: product.code,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        imageUrl: product.image_url,
        isActive: product.is_active,
        isBestseller: product.is_bestseller,
        salesCount: product.sales_count,
      }))
    );

    setCoupons(
      (couponRows ?? []).map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent
          ? Number(coupon.discount_percent)
          : null,
        discountAmount: coupon.discount_amount
          ? Number(coupon.discount_amount)
          : null,
        isActive: coupon.is_active,
        expiresAt: coupon.expires_at,
        createdAt: coupon.created_at,
        productIds: (linkRows ?? [])
          .filter((row) => row.coupon_id === coupon.id)
          .map((row) => row.product_id),
      }))
    );

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  if (ctxLoading || !companyId) {
    return <p className="text-gray-500">Cargando promociones...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promociones</h1>
          <p className="text-sm text-gray-500">
            Cupones con alcance por producto o global.
          </p>
        </div>
        <Button
          variant="green"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cupón
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Activos</p>
          <p className="mt-2 text-2xl font-bold">
            {coupons.filter((coupon) => coupon.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Totales</p>
          <p className="mt-2 text-2xl font-bold">{coupons.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Productos</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Cupón</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Estado</th>
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
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay cupones creados
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-brand-green" />
                      <span className="font-semibold uppercase">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCouponValue(coupon)}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.productIds.length === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue">
                        <ShieldCheck className="h-3 w-3" />
                        Todos
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {coupon.productIds.slice(0, 3).map((productId) => {
                          const product = productMap.get(productId);
                          return (
                            <span
                              key={productId}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {product?.name ?? productId}
                            </span>
                          );
                        })}
                        {coupon.productIds.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            +{coupon.productIds.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(coupon.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {coupon.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-brand-blue"
                        onClick={() => {
                          setEditing(coupon);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-red-500"
                        onClick={async () => {
                          if (!confirm("¿Eliminar cupón?")) return;
                          await deleteCoupon(companyId, coupon.id);
                          load();
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

      <CouponFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        companyId={companyId}
        products={products}
        coupon={editing}
      />
    </div>
  );
}
