"use client";

import type { CartItem } from "@/domain/entities/order";
import type { Product, ProductTopping, ProductVariant } from "@/domain/entities/product";
import { type DeliveryMethod, DELIVERY_METHOD_LABELS, type PaymentMethod } from "@/domain/enums";
import { printThermalTicket } from "@/app/actions/admin";
import { orderRepository } from "@/infrastructure/repositories/order-repository";
import { createClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import GoogleMapsComponent from "@/presentation/components/menu/MapLocation";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { ArrowLeft, Copy, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";

type CatalogTopping = Omit<ProductTopping, "variantId"> & {
  variantId: string | null;
};

type CatalogProduct = Product & {
  variants: ProductVariant[];
  toppings: CatalogTopping[];
};

type DraftTopping = CatalogTopping & {
  isSelected: boolean;
};

type DraftItem = {
  id: string;
  product: CatalogProduct;
  quantity: number;
  selectedVariantId: string | null;
  toppings: DraftTopping[];
  specialInstructions: string;
};

function buildInitialToppings(product: CatalogProduct): DraftTopping[] {
  return product.toppings.map((topping) => ({
    ...topping,
    isSelected:
      topping.mode === "locked" || topping.mode === "default_included",
  }));
}

function getSelectedVariant(item: DraftItem) {
  if (item.product.variants.length === 0) return null;
  return (
    item.product.variants.find((variant) => variant.id === item.selectedVariantId) ??
    item.product.variants[0]
  );
}

function getVisibleToppings(item: DraftItem) {
  const selectedVariant = getSelectedVariant(item);
  return item.toppings.filter((topping) => {
    if (!topping.variantId) return true;
    return topping.variantId === selectedVariant?.id;
  });
}

function buildCartItem(item: DraftItem): CartItem {
  const selectedVariant = getSelectedVariant(item);
  const hasVariants = item.product.variants.length > 0;
  const productName =
    hasVariants && selectedVariant
      ? `${item.product.name} (${selectedVariant.name})`
      : item.product.name;
  const unitPrice =
    hasVariants && selectedVariant
      ? Number(selectedVariant.price)
      : Number(item.product.price);

  return {
    id: item.id,
    productId: item.product.id,
    productName,
    unitPrice,
    quantity: item.quantity,
    toppings: getVisibleToppings(item)
      .filter((topping) => topping.isSelected)
      .map((topping) => ({
      name: topping.name,
      isSelected: topping.isSelected,
      mode: topping.mode,
      })),
    addons: [],
    specialInstructions: item.specialInstructions,
  };
}

function createDraftItem(product: CatalogProduct): DraftItem {
  return {
    id: crypto.randomUUID(),
    product,
    quantity: 1,
    selectedVariantId: product.variants[0]?.id ?? null,
    toppings: buildInitialToppings(product),
    specialInstructions: "",
  };
}

export function OrderCreateAdminClient() {
  const router = useRouter();
  const { companyId, company, loading: ctxLoading } = useCompany();
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [coords, setCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [insideZone, setInsideZone] = useState<boolean | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!companyId) return;

    setLoadingCatalog(true);
    const supabase = createClient();

    const { data: products, error } = await supabase
      .from("products")
      .select(
        "id, company_id, category_id, code, name, description, price, image_url, is_active, is_bestseller, sales_count"
      )
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("loadCatalog products error:", error);
      setCatalog([]);
      setLoadingCatalog(false);
      return;
    }

    const mapped = await Promise.all(
      (products ?? []).map(async (product) => {
        const [{ data: variants }, { data: toppings }] = await Promise.all([
          supabase
            .from("product_variants")
            .select("*")
            .eq("product_id", product.id)
            .order("sort_order"),
          supabase
            .from("product_toppings")
            .select("*")
            .eq("product_id", product.id)
            .order("sort_order"),
        ]);

        return {
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
          variants: (variants ?? []).map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: Number(variant.price),
          })),
          toppings: (toppings ?? []).map((topping) => ({
            id: topping.id,
            productId: topping.product_id,
            name: topping.name,
            mode: topping.mode,
            sortOrder: topping.sort_order,
            variantId: topping.variant_id,
            maxSelectable: topping.max_selectable,
          })),
        };
      })
    );

    setCatalog(mapped);
    setLoadingCatalog(false);
  }, [companyId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return [];
    return catalog.filter((product) => {
      const searchable = [product.name, product.code, product.description ?? ""]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [catalog, searchTerm]);

  const subtotal = items.reduce((sum, item) => {
    const cartItem = buildCartItem(item);
    return sum + cartItem.unitPrice * cartItem.quantity;
  }, 0);

  const handleAddProduct = (product: CatalogProduct) => {
    setItems((current) => [...current, createDraftItem(product)]);
    setSearchTerm("");
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId: string, updater: (item: DraftItem) => DraftItem) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? updater(item) : item))
    );
  };

  const handleVariantChange = (itemId: string, variantId: string) => {
    updateItem(itemId, (item) => ({
      ...item,
      selectedVariantId: variantId,
      toppings: item.toppings.map((topping) => ({
        ...topping,
        isSelected:
          topping.mode === "locked" || topping.mode === "default_included",
      })),
    }));
  };

  const handleToggleTopping = (itemId: string, toppingId: string) => {
    updateItem(itemId, (item) => {
      const target = item.toppings.find((topping) => topping.id === toppingId);
      if (!target) return item;
      if (target.mode === "locked" || target.mode === "default_included") return item;

      const visibleToppings = getVisibleToppings(item);
      const selectedCount = visibleToppings.filter(
        (topping) => topping.isSelected && topping.mode !== "locked"
      ).length;

      if (
        !target.isSelected &&
        target.mode !== "required_choice" &&
        selectedCount >= target.maxSelectable
      ) {
        alert(
          `Limite alcanzado. Solo puedes seleccionar hasta ${target.maxSelectable} opciones.`
        );
        return item;
      }

      if (target.mode === "required_choice") {
        return {
          ...item,
          toppings: item.toppings.map((topping) =>
            topping.mode === "required_choice" &&
            topping.variantId === target.variantId
              ? { ...topping, isSelected: topping.id === toppingId }
              : topping
          ),
        };
      }

      return {
        ...item,
        toppings: item.toppings.map((topping) =>
          topping.id === toppingId
            ? { ...topping, isSelected: !topping.isSelected }
            : topping
        ),
      };
    });
  };

  const handleLocationChange = (
    newCoords: google.maps.LatLngLiteral,
    indoor?: Boolean
  ) => {
    setCoords(newCoords);
    setInsideZone(typeof indoor === "undefined" ? null : !!indoor);
  };

  const copyTransferClabe = async () => {
    const clabe = company?.profile?.transferClabe ?? "";
    if (!clabe) return;
    await navigator.clipboard.writeText(clabe);
    alert("CLABE copiada");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId) return;
    if (items.length === 0) {
      alert("Agrega al menos un producto");
      return;
    }
    if (!deliveryMethod) {
      alert("Selecciona el tipo de entrega");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Completa el nombre y telefono del cliente");
      return;
    }
    if (deliveryMethod === "delivery") {
      if (!customerAddress.trim()) {
        alert("Agrega la direccion de entrega");
        return;
      }
      if (!coords) {
        alert("Selecciona la ubicacion en el mapa");
        return;
      }
      if (insideZone === false) {
        alert("La ubicacion seleccionada esta fuera de la zona de servicio");
        return;
      }
    }
    if (paymentMethod === "cash" && !cashAmount.trim()) {
      alert("Indica con cuanto paga el cliente");
      return;
    }

    setSaving(true);

    const payload = {
      companyId,
      deliveryMethod,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress:
        deliveryMethod === "delivery" ? customerAddress.trim() : undefined,
      customerLat: coords?.lat,
      customerLng: coords?.lng,
      paymentMethod,
      cashAmount: paymentMethod === "cash" ? Number(cashAmount) || subtotal : undefined,
      discountAmount: 0,
      subtotal,
      total: subtotal,
      items: items.map(buildCartItem),
    };

    const created = await orderRepository.createOrder(payload);
    setSaving(false);

    if (!created) {
      alert("No se pudo registrar la orden");
      return;
    }

    try {
      await printThermalTicket({
        companyName: company?.name ?? "Negocio",
        orderNumber: created.orderNumber,
        deliveryMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress:
          deliveryMethod === "delivery" ? customerAddress.trim() : undefined,
        paymentMethod,
        cashAmount: paymentMethod === "cash" ? Number(cashAmount) || subtotal : null,
        subtotal,
        discountAmount: 0,
        total: subtotal,
        items: items.map(buildCartItem),
      });
    } catch (error) {
      console.error("printThermalTicket error:", error);
      alert("La orden se guardó, pero no se pudo imprimir el ticket.");
    }

    router.replace("/admin/dashboard/orders");
  };

  if (ctxLoading || !companyId) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard/orders")}
          className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-gray-600 hover:bg-gray-50"
          aria-label="Volver a ordenes"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Nueva orden</h1>
          <p className="text-sm text-gray-500">
            Alta manual de pedidos desde administracion.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Buscar productos</h2>
              <p className="text-sm text-gray-500">
                Encuentra un producto y agregalo a la orden.
              </p>
            </div>

            <div className="relative">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Buscar por nombre o codigo"
                />
              </label>

              {searchTerm.trim() !== "" && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                  {loadingCatalog ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      Cargando catalogo...
                    </p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No hay coincidencias.
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.code}
                            {product.variants.length > 0
                              ? ` - ${product.variants.length} variantes`
                              : ""}
                          </p>
                          <p className="text-sm font-semibold text-brand-green">
                            {formatCurrency(
                              product.variants[0]?.price ?? product.price
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-400">
                          Seleccionar
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Productos en la orden</h2>
                <p className="text-sm text-gray-500">
                  Ajusta variantes, toppings y cantidades.
                </p>
              </div>
              <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
                {items.length} items
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Aun no agregas productos.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const selectedVariant = getSelectedVariant(item);
                  const visibleToppings = getVisibleToppings(item);
                  const optionalToppings = visibleToppings.filter(
                    (topping) => topping.mode !== "required_choice"
                  );
                  const requiredToppings = visibleToppings.filter(
                    (topping) => topping.mode === "required_choice"
                  );
                  const unitPrice = selectedVariant
                    ? Number(selectedVariant.price)
                    : Number(item.product.price);

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedVariant
                              ? `Variante: ${selectedVariant.name}`
                              : "Sin variantes"}
                          </p>
                          <p className="text-sm font-semibold text-brand-green">
                            {formatCurrency(unitPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-red-500"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.product.variants.length > 0 && (
                        <div className="mb-4">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Variante
                          </label>
                          <select
                            value={
                              item.selectedVariantId ??
                              item.product.variants[0]?.id ??
                              ""
                            }
                            onChange={(e) =>
                              handleVariantChange(item.id, e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                          >
                            {item.product.variants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.name} - {formatCurrency(variant.price)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {optionalToppings.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Toppings
                          </p>
                          <div className="space-y-2">
                            {optionalToppings.map((topping) => (
                              <label
                                key={topping.id}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                                  topping.mode === "locked" ||
                                    topping.mode === "default_included"
                                    ? "border-gray-200 bg-white text-gray-500"
                                    : "border-gray-200 bg-white"
                                )}
                              >
                                <input
                                  type={
                                    topping.mode === "required_choice"
                                      ? "radio"
                                      : "checkbox"
                                  }
                                  checked={topping.isSelected}
                                  disabled={
                                    topping.mode === "locked" ||
                                    topping.mode === "default_included"
                                  }
                                  name={`required-${item.id}-${
                                    item.selectedVariantId ?? "global"
                                  }`}
                                  onChange={() =>
                                    handleToggleTopping(item.id, topping.id)
                                  }
                                />
                                <span className="flex-1">{topping.name}</span>
                                <span className="text-xs text-gray-400">
                                  {topping.mode}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {requiredToppings.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                            Seleccion obligatoria
                          </p>
                          <div className="space-y-2">
                            {requiredToppings.map((topping) => (
                              <label
                                key={topping.id}
                                className="flex items-center gap-3 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm"
                              >
                                <input
                                  type="radio"
                                  checked={topping.isSelected}
                                  name={`required-${item.id}-${
                                    item.selectedVariantId ?? "global"
                                  }`}
                                  onChange={() =>
                                    handleToggleTopping(item.id, topping.id)
                                  }
                                />
                                <span className="flex-1">{topping.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, (current) => ({
                                ...current,
                                quantity: Math.max(1, current.quantity - 1),
                              }))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, (current) => ({
                                ...current,
                                quantity: current.quantity + 1,
                              }))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-white hover:bg-brand-green-dark"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Instrucciones especiales
                          </label>
                          <textarea
                            value={item.specialInstructions}
                            onChange={(e) =>
                              updateItem(item.id, (current) => ({
                                ...current,
                                specialInstructions: e.target.value,
                              }))
                            }
                            rows={2}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                            placeholder="Sin cebolla, extra salsa..."
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Tipo de entrega</h2>
            <div className="grid gap-3">
              {(
                [
                  ["delivery", "A domicilio"],
                  ["pickup", "Pasar a recoger"],
                  ["dine_in", "Comer en comedor"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeliveryMethod(value)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    deliveryMethod === value
                      ? "border-brand-green bg-brand-green/10 text-brand-green"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-gray-500">
                    {DELIVERY_METHOD_LABELS[value]}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Datos del cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefono</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  placeholder="5512345678"
                />
              </div>
              {deliveryMethod === "delivery" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Direccion</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    placeholder="Calle, numero, colonia..."
                  />
                </div>
              )}
            </div>
          </section>

          {deliveryMethod === "delivery" && (
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">Mapa</h2>
                <p className="text-sm text-gray-500">
                  Selecciona la ubicacion exacta del cliente.
                </p>
              </div>
              <GoogleMapsComponent onLocationChange={handleLocationChange} />
              {coords && (
                <p className="mt-3 text-xs text-gray-500">
                  Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Metodo de pago</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["cash", "Efectivo"],
                    ["transfer", "Transferencia"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition",
                      paymentMethod === value
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <p className="font-medium">{label}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === "cash" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Con cuanto paga
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    placeholder={String(subtotal || 0)}
                  />
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <p>
                    <span className="text-gray-500">Nombre: </span>
                    {company?.profile?.transferOwnerName ?? "Sin configurar"}
                  </p>
                  <p>
                    <span className="text-gray-500">Banco: </span>
                    {company?.profile?.transferBank ?? "Sin configurar"}
                  </p>
                  <p>
                    <span className="text-gray-500">CLABE: </span>
                    {company?.profile?.transferClabe ?? "Sin configurar"}
                  </p>
                  <Button
                    type="button"
                    variant="blue"
                    size="sm"
                    onClick={copyTransferClabe}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar CLABE
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Resumen</h2>
                <p className="text-sm text-gray-500">
                  Revisa el total antes de guardar.
                </p>
              </div>
              <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="green"
              fullWidth
              className="mt-5"
              disabled={saving || items.length === 0}
            >
              {saving ? "Guardando..." : "Dar de alta orden"}
            </Button>
          </section>
        </div>
      </div>
    </form>
  );
}
