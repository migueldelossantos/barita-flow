"use client";

import type { ProductWithDetails } from "@/domain/entities/product";
import type { ToppingMode } from "@/domain/enums";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import {
  computeItemUnitPrice,
  useOrderSession,
} from "@/presentation/stores/order-session-store";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "../ui/Button";

interface ProductDetailClientProps {
  // Extendemos la interfaz localmente para reconocer variantes dinámicas de la base de datos
  product: ProductWithDetails & { product_variants?: any[] };
  companyId: string;
}

function initToppings(product: ProductWithDetails) {
  return product.toppings.map((t: any) => ({
    id: t.id,
    name: t.name,
    mode: t.mode as ToppingMode,
    variantId: t.variantId ?? null, // Mapeo de relación por variante
    maxSelectable: t.maxSelectable ?? 1,
    isSelected:
      t.mode === "locked" ||
      t.mode === "default_included" ||
      t.mode === "optional",
  }));
}

export function ProductDetailClient({
  product,
  companyId,
}: ProductDetailClientProps) {
  const router = useRouter();
  const addToCart = useOrderSession((s) => s.addToCart);

  // --- CONTROL DE VARIANTES ---
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  // Inicializa automáticamente con la primera variante como default si existen
  const [selectedVariant, setSelectedVariant] = useState<any>(
    hasVariants ? variants[0] : null
  );

  const [quantity, setQuantity] = useState(1);
  const [toppings, setToppings] = useState(() => initToppings(product));
  const [addons, setAddons] = useState(() =>
    product.addonProducts.map((a) => ({
      productId: a.id,
      name: a.name,
      price: a.price,
      quantity: 0,
    }))
  );
  const [instructions, setInstructions] = useState("");

  // --- MANEJO CAMBIO DE VARIANTE ---
  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    // Opcional: Reiniciar la selección de toppings opcionales al alternar variantes
    setToppings((prev) =>
      prev.map((t) => ({
        ...t,
        isSelected: t.mode === "locked" || t.mode === "default_included",
      }))
    );
  };

  // --- FILTRADO DE TOPPINGS REACTIVOS ---
  // Evaluamos los toppings que corresponden a la variante seleccionada o globales
  const currentToppingsVisibles = useMemo(() => {
    return toppings.filter((t) => {
      if (!t.variantId) return true; // Si no tiene variante asignada, es global
      return t.variantId === selectedVariant?.id;
    });
  }, [toppings, selectedVariant]);

  const defaultToppings = currentToppingsVisibles.filter(
    (t) => t.mode !== "required_choice"
  );
  const requiredToppings = currentToppingsVisibles.filter(
    (t) => t.mode === "required_choice"
  );

  // --- CÁLCULO DE PRECIOS ---
  // Si tiene variantes toma su precio dinámico, de lo contrario cae al precio plano del producto
  const basePrice = hasVariants ? (selectedVariant?.price ?? 0) : product.price;

  const unitPrice = useMemo(
    () => computeItemUnitPrice(basePrice, addons),
    [basePrice, addons]
  );
  const lineTotal = unitPrice * quantity;

  // --- MANEJO DE SELECCIONES ---
  const toggleTopping = (id: string) => {
    setToppings((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const grupoSeleccionados = prev.filter(
        (t) => t.variantId === target.variantId && t.isSelected && t.mode !== "locked"
      ).length;

      if (!target.isSelected && grupoSeleccionados >= target.maxSelectable) {
        alert(`Límite alcanzado. Solo puedes seleccionar hasta ${target.maxSelectable} opciones.`);
        return prev.map((t) => 
          t.id === id
            ? { ...t, isSelected: false }
            : t
        );
      }

      return prev.map((t) =>
        t.id === id &&
        t.mode !== "locked" &&
        t.mode !== "default_included" &&
        t.mode !== "required_choice"
          ? { ...t, isSelected: !t.isSelected }
          : t
      );
    });
  };

  const selectRequired = (id: string) => {
    setToppings((prev) => {
      const target = prev.find((t) => t.id === id);
      return prev.map((t) =>
        t.mode === "required_choice" && t.variantId === target?.variantId
          ? { ...t, isSelected: t.id === id }
          : t
      );
    });
  };

  const updateAddon = (productId: string, delta: number) => {
    setAddons((prev) =>
      prev.map((a) =>
        a.productId === productId
          ? { ...a, quantity: Math.max(0, a.quantity + delta) }
          : a
      )
    );
  };

  const handleAdd = () => {
    const finalProductName = hasVariants 
      ? `${product.name} (${selectedVariant.name})` 
      : product.name;

    const hasSelectectToppings = requiredToppings.length > 0 && currentToppingsVisibles.filter((t) => t.isSelected).length === 0
    if (hasSelectectToppings) {
      alert(`Debes de seleccionar al menos un topping para tu producto.`);
      return null;
    }

    addToCart({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: finalProductName,
      unitPrice,
      quantity,
      toppings: currentToppingsVisibles.filter((t) => t.isSelected),
      addons: [],
      specialInstructions: instructions,
    });

    if (addons.length > 0) {
      addons
        .filter((a) => a.quantity > 0)
        .map((a) => {
          addToCart({
            id: crypto.randomUUID(),
            productId: a.productId,
            productName: a.name, // Corrección: enviamos el nombre del addon en vez del producto base
            unitPrice: a.price,
            quantity: a.quantity,
            toppings: [],
            addons: [],
            specialInstructions: "",
          });
        });
    }
    router.push(`/menu/${companyId}`);
  };

  const imageSrc =
    product.imageUrl ??
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";

  return (
    <div className="flex min-h-screen flex-col bg-white pb-28">
      <div className="relative h-[25vh] min-h-[160px] w-full">
        <Image src={imageSrc} alt={product.name} fill className="object-cover" />
        <Link
          href={`/menu/${companyId}`}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex-1 space-y-6 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="mt-2 text-sm text-gray-600">{product.description}</p>
          )}
        </div>

        {/* --- NUEVO: SELECTOR DE VARIANTES --- */}
        {hasVariants && (
          <section className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Selecciona una opción
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((v) => {
                const active = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantChange(v)}
                    className={cn(
                      "flex flex-col items-center justify-center border p-3 rounded-xl transition-all",
                      active
                        ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-sm">{v.name}</span>
                    <span className="text-xs opacity-75">{formatCurrency(v.price)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div>
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
            Precio: {formatCurrency(basePrice)}
          </span>
        </div>

        {defaultToppings.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Personaliza tu pedido
            </h2>
            <ul className="space-y-2">
              {defaultToppings.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 text-sm cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={t.isSelected}
                    disabled={t.mode === "locked" || t.mode === "default_included"}
                    onChange={() => toggleTopping(t.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                  />
                  <span
                    className={cn(
                      (t.mode === "locked" || t.mode === "default_included") &&
                        "text-gray-500"
                    )}
                  >
                    {t.name}
                    {t.mode === "locked" && " (obligatorio)"}
                    {t.mode === "default_included" && " (incluido)"}
                  </span>
                </label>
              ))}
            </ul>
          </section>
        )}

        {requiredToppings.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-red-600">
              Selección obligatoria *
            </h2>
            <ul className="space-y-2">
              {requiredToppings.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 text-sm cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name={`required-topping-${selectedVariant?.id ?? "global"}`}
                    checked={t.isSelected}
                    onChange={() => selectRequired(t.id)}
                    className="h-4 w-4 text-brand-blue focus:ring-brand-blue"
                  />
                  {t.name}
                </label>
              ))}
            </ul>
          </section>
        )}

        <section>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Instrucciones especiales
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="Ej. sin cebolla, extra picante..."
            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-blue"
          />
        </section>

        {product.addonProducts.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              ¿Algún otro antojo?
            </h2>
            <ul className="space-y-3">
              {addons.map((addon) => (
                <li
                  key={addon.productId}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex-1 text-sm text-gray-800">
                    {addon.name}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(addon.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateAddon(addon.productId, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {addon.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateAddon(addon.productId, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-brand-green text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-brand-green text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="green"
            fullWidth
            onClick={handleAdd}
            className="flex-1 font-semibold"
          >
            {formatCurrency(lineTotal)} | Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}