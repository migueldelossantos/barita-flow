"use client";

import { saveProduct } from "@/app/actions/admin";
import type { ToppingInput } from "@/app/actions/admin";
import type { Category, Product, ProductTopping } from "@/domain/entities/product";
import type { ToppingMode } from "@/domain/enums";
import { TOPPING_MODE_LABELS } from "@/domain/enums";
import { generateProductCode } from "@/lib/product-code";
import { formatCurrency } from "@/lib/format";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ImageUploadField } from "./ImageUploadField";
import { Plus, X } from "lucide-react";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  categories: Category[];
  product?: (Product & { toppings?: ProductTopping[] }) | null;
  existingCodes: string[];
  onSaved: () => void;
}

interface VariantRow {
  id: string;
  name: string;
  price: string;
}

interface ToppingRow {
  id: string;
  name: string;
  mode: ToppingMode;
  variantId: string;
  maxSelectable: number;
}
interface OptionGroupRow { id: string; name: string; selectionType: "required" | "optional" | "multiple"; minSelections: number; maxSelections: number; options: { id: string; name: string; priceAdjustment: string }[]; }

const MODES: ToppingMode[] = [
  "locked",
  "required_choice",
  "default_included",
  "optional",
];

export function ProductFormModal({
  open,
  onClose,
  companyId,
  categories,
  product,
  existingCodes,
  onSaved,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [toppingInput, setToppingInput] = useState("");
  const [toppings, setToppings] = useState<ToppingRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroupRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? String(product.price) : "");
    setCategoryId(product?.categoryId ?? categories[0]?.id ?? "");
    setImageUrl(product?.imageUrl ?? null);

    const productVariants = (product as any)?.variants ?? [];
    if (productVariants.length > 0) {
      setVariants(productVariants.map((v: any) => ({ id: v.id, name: v.name, price: String(v.price) })));
      setHasVariants(true);
    } else {
      setVariants([]);
      setHasVariants(false);
    }

    setToppings(
      ((product as any)?.toppings ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        mode: t.mode,
        variantId: t.variantId ?? "all",
        maxSelectable: t.maxSelectable ?? 1
      }))
    );
    setOptionGroups(((product as any)?.optionGroups ?? []).map((group: any) => ({ id: group.id, name: group.name, selectionType: group.selectionType, minSelections: group.minSelections, maxSelections: group.maxSelections, options: group.options.map((option: any) => ({ id: option.id, name: option.name, priceAdjustment: String(option.priceAdjustment) })) })));
  }, [open, product, categories]);

  const addVariant = () => {
    setVariants([...variants, { id: crypto.randomUUID(), name: "", price: "" }])
  }

  const updateVariant = (id: string, field: keyof VariantRow, value: string) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v )))
  }

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id))
    setToppings(toppings.map(t => t.variantId === id ? { ...t, variantId: "all" } : t))
  }

  const updateToppingProperty = (id: string, property: keyof ToppingRow, value: any) => {
    setToppings(toppings.map((t) => (t.id === id) ? { ...t, [property]: value } : t))
  }  

  const addTopping = () => {
    if (!toppingInput.trim()) return;
    setToppings((t) => [
      ...t,
      {
        id: crypto.randomUUID(),
        name: toppingInput.trim(),
        mode: "optional",
        variantId: "all",
        maxSelectable: 1
      },
    ]);
    setToppingInput("");
  };

  const setToppingMode = (id: string, mode: ToppingMode) => {
    setToppings((rows) =>
      rows.map((r) => (r.id === id ? { ...r, mode } : r))
    );
  };

  const removeTopping = (id: string) => {
    setToppings((rows) => rows.filter((r) => r.id !== id));
  };
  const addOptionGroup = () => setOptionGroups((current) => [...current, { id: crypto.randomUUID(), name: "", selectionType: "required", minSelections: 1, maxSelections: 1, options: [{ id: crypto.randomUUID(), name: "", priceAdjustment: "0" }] }]);
  const updateOptionGroup = (id: string, patch: Partial<OptionGroupRow>) => setOptionGroups((current) => current.map((group) => group.id === id ? { ...group, ...patch } : group));
  const updateOption = (groupId: string, optionId: string, patch: { name?: string; priceAdjustment?: string }) => setOptionGroups((current) => current.map((group) => group.id === groupId ? { ...group, options: group.options.map((option) => option.id === optionId ? { ...option, ...patch } : option) } : group));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasVariants && variants.length === 0) {
      alert("Si activas las variantes, deben agregar al menos una.");
      return;
    }

    setSaving(true);
    try {
      const code = product?.code ?? generateProductCode(name, existingCodes);
      const toppingPayload = toppings.map((t) => ({
        name: t.name,
        mode: t.mode,
        variantId: t.variantId === "all" ? null : t.variantId, // Si es 'all' va como NULL global
        maxSelectable: t.maxSelectable
      }));

      const variantPayload = hasVariants 
        ? variants.map(v => ({ id: v.id, name: v.name, price: parseFloat(v.price) || 0 }))
        : [];

      await saveProduct(companyId, product?.id ?? null, {
        name,
        description,
        price: hasVariants ? 0 : (parseFloat(price) || 0),
        categoryId: categoryId || null,
        imageUrl,
        isActive: product?.isActive ?? true,
        variants: variantPayload,
        optionGroups: optionGroups.map((group) => ({ name: group.name, selectionType: group.selectionType, minSelections: group.selectionType === "required" ? Math.max(1, group.minSelections) : 0, maxSelections: group.selectionType === "multiple" ? Math.max(1, group.maxSelections) : 1, options: group.options.map((option) => ({ name: option.name, priceAdjustment: parseFloat(option.priceAdjustment) || 0 })) })),
        toppings: toppingPayload,
      }, code);

      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Editar producto" : "Nuevo producto"}
    >
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {product && (
          <p className="text-xs text-gray-500">Código: {product.code}</p>
        )}

        <section className="space-y-4 rounded-xl border bg-gray-50 p-4">
          <h3 className="font-semibold">Datos básicos</h3>
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Precio de venta</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {price && (
            <p className="mt-1 text-xs text-gray-500">
              Vista previa: {formatCurrency(parseFloat(price) || 0)}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <ImageUploadField
          companyId={companyId}
          folder="products"
          label="Imagen del producto"
          value={imageUrl}
          onChange={setImageUrl}
        />
        <div className="rounded-lg bg-white p-3 text-sm shadow-sm"><span className="font-medium">Vista previa:</span> {name || "Nombre del producto"} · <span className="text-brand-green">{formatCurrency(parseFloat(price) || 0)}</span>{description && <p className="mt-1 text-xs text-gray-500">{description}</p>}</div>
        </section>

        <div className="flex items-center gap-2 py-2">
          <input 
            type="checkbox" 
            id="hasVariants" 
            checked={hasVariants} 
            onChange={(e) => setHasVariants(e.target.checked)} 
          />
          <label htmlFor="hasVariants" className="text-sm font-medium">Este producto tiene múltiples variantes (ej: Tamaños, Combinaciones)</label>
        </div>

        {hasVariants && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">Variantes del Producto</label>
              <Button type="button" variant="outline" onClick={addVariant} className="text-xs py-1 h-8">
                <Plus className="h-3 w-3 mr-1" /> Añadir variante
              </Button>
            </div>
            
            {variants.map((v, index) => (
              <div key={v.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                <input
                  required
                  placeholder="ej. Sencilla o Grande"
                  value={v.name}
                  onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                  className="flex-1 rounded-md border bg-white px-2 py-1 text-sm"
                />
                <input
                  required
                  type="number"
                  placeholder="Precio"
                  value={v.price}
                  onChange={(e) => updateVariant(v.id, "price", e.target.value)}
                  className="w-24 rounded-md border bg-white px-2 py-1 text-sm"
                />
                <button type="button" onClick={() => removeVariant(v.id)}>
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        <section className="space-y-3 rounded-xl border p-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Grupos de opciones</h3><p className="text-xs text-gray-500">Ej.: Tamaño, Tipo de tortilla o Salsa.</p></div><Button type="button" variant="outline" size="sm" onClick={addOptionGroup}><Plus className="mr-1 h-3 w-3" />Grupo</Button></div>{optionGroups.map((group) => <div key={group.id} className="space-y-2 rounded-lg bg-gray-50 p-3"><div className="grid gap-2 sm:grid-cols-3"><input value={group.name} onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })} placeholder="Ej.: Tamaño" className="rounded border px-2 py-1.5 text-sm" /><select value={group.selectionType} onChange={(e) => updateOptionGroup(group.id, { selectionType: e.target.value as OptionGroupRow["selectionType"] })} className="rounded border px-2 py-1.5 text-sm"><option value="required">Una obligatoria</option><option value="optional">Una opcional</option><option value="multiple">Varias opciones</option></select>{group.selectionType === "multiple" && <input type="number" min="1" value={group.maxSelections} onChange={(e) => updateOptionGroup(group.id, { maxSelections: Number(e.target.value) || 1 })} className="rounded border px-2 py-1.5 text-sm" />}</div>{group.options.map((option) => <div key={option.id} className="flex gap-2"><input value={option.name} onChange={(e) => updateOption(group.id, option.id, { name: e.target.value })} placeholder="Ej.: Grande" className="flex-1 rounded border px-2 py-1.5 text-sm" /><input type="number" step="0.01" value={option.priceAdjustment} onChange={(e) => updateOption(group.id, option.id, { priceAdjustment: e.target.value })} placeholder="Extra" className="w-24 rounded border px-2 py-1.5 text-sm" /></div>)}<button type="button" className="text-xs text-brand-blue" onClick={() => updateOptionGroup(group.id, { options: [...group.options, { id: crypto.randomUUID(), name: "", priceAdjustment: "0" }] })}>+ Agregar opción</button></div>)}</section>

        <section className="rounded-xl border p-4">
          <label className="mb-2 block text-sm font-semibold">Toppings</label>
          <div className="flex gap-2">
            <input
              value={toppingInput}
              onChange={(e) => setToppingInput(e.target.value)}
              placeholder="ej. Cebolla"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopping())}
            />
            <Button type="button" variant="blue" onClick={addTopping}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-3 space-y-3">
            {toppings.map((t) => (
              <li key={t.id} className="rounded-lg border border-gray-100 p-3 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{t.name}</span>
                  <button type="button" onClick={() => removeTopping(t.id)}>
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-md">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">¿Aplica a qué variante?</label>
                    <select
                      value={t.variantId}
                      onChange={(e) => updateToppingProperty(t.id, "variantId", e.target.value)}
                      className="w-full text-xs border rounded p-1 bg-white"
                    >
                      <option value="all">Todas las variantes</option>
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>{v.name || `Variante sin nombre (${formatCurrency(parseFloat(v.price) || 0)})`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Máx. Toppings a elegir</label>
                    <input
                      type="number"
                      min="1"
                      value={t.maxSelectable}
                      onChange={(e) => updateToppingProperty(t.id, "maxSelectable", parseInt(e.target.value) || 1)}
                      className="w-full text-xs border rounded p-1 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {MODES.map((mode) => (
                    <label key={mode} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`mode-${t.id}`}
                        checked={t.mode === mode}
                        onChange={() => setToppingMode(t.id, mode)}
                      />
                      <span className="text-xs">{TOPPING_MODE_LABELS[mode]}</span>
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="green" fullWidth disabled={saving}>
            {product ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
