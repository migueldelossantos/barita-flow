"use client";

import type { CompanyWithProfile } from "@/domain/entities/company";
import type { Category, Product } from "@/domain/entities/product";
import { DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS, DELIVERY_METHODS, DeliveryMethod } from "@/domain/enums";
import { formatCurrency } from "@/lib/format";
import { useOrderSession } from "@/presentation/stores/order-session-store";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CollapsibleBanner } from "./CollapsibleBanner";
import { DeliveryMethodModal } from "./DeliveryMethodModal";
import { FloatingMenuButton } from "./FloatingMenuButton";
import { ProductCard } from "./ProductCard";
import { FloatingBar } from "../ui/FloatingBar";
import { cn } from "@/lib/cn";

interface MenuPageClientProps {
  company: CompanyWithProfile;
  categories: Category[];
  products: Product[];
  bestsellers: Product[];
}

export function MenuPageClient({
  company,
  categories,
  products,
  bestsellers,
}: MenuPageClientProps) {
  const {
    deliveryMethod,
    deliveryModalSeen,
    setCompanyId,
    setDeliveryMethod,
    setDeliveryModalSeen,
    cart,
    cartTotal,
  } = useOrderSession();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [showDeliveryModal, setShowDeliveryModal] = useState(true);
  const router = useRouter();

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  const [searchTerm, setSearchTerm] = useState("");

  // --- ESCUCHA DEL SCROLL EN EL CONTENEDOR INTERNO ---
  useEffect(() => {
    const scrollContainer = document.getElementById("menu-scroll");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setCompanyId(company.id);
  }, [company.id, setCompanyId]);

  useEffect(() => {
    if (!deliveryModalSeen || !deliveryMethod) {
      setShowDeliveryModal(true);
    }
  }, [deliveryModalSeen, deliveryMethod]);

  useEffect(() => {
  // Cuando el usuario tenga al menos 1 producto en el carrito, pre-cargamos la página del carrito y del checkout
    if (cart.length > 0) {
      router.prefetch(`/menu/${company.id}/cart`);
      router.prefetch(`/menu/${company.id}/checkout`);
    }
  }, [cart.length, company.id, router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchTerm); // Esto dispara el useMemo de "filtered" de forma limpia
    }, 250); // Espera a que el usuario deje de escribir por 250ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDeliverySelect = (method: typeof deliveryMethod) => {
    if (!method) return;
    setDeliveryMethod(method);
    setDeliveryModalSeen(true);
    setShowDeliveryModal(false);
  };

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") {
      list = list.filter((p) => p.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const total = cartTotal();
  const canShowMenu = deliveryMethod && deliveryModalSeen;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DeliveryMethodModal
        open={showDeliveryModal && !deliveryMethod}
        onSelect={handleDeliverySelect}
      />

      <FloatingMenuButton
        companyId={company.id}
        cartCount={cart.length}
        address={company.profile?.address ?? null}
      />

      {canShowMenu && (
        <>
          <div
            id="menu-scroll"
            className="flex-1 overflow-y-auto pb-28 h-full"
          >
            <CollapsibleBanner
              name={company.name}
              slogan={company.profile?.slogan ?? null}
              bannerUrl={company.profile?.bannerUrl ?? null}
              logoUrl={company.profile?.logoUrl ?? null}
            />
            <div className={cn(
                "sticky z-20 space-y-3 bg-white px-4 pb-2 pt-3 transition-all duration-300",
                showHeader ? "top-0" : "top-0"
              )}>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-green/10 px-3 pt-2 text-xs font-medium text-brand-green">
                  {ORDER_STATUS_LABELS.open}
                </span>
                {deliveryMethod && (
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    className="w-60 rounded-lg border px-3 py-2 text-sm"
                  >
                    {DELIVERY_METHODS.map((c) => (
                      <option key={c} value={c}>
                        {DELIVERY_METHOD_LABELS[c as DeliveryMethod]}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === "all"
                      ? "bg-brand-green text-white"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      activeCategory === cat.id
                        ? "bg-brand-green text-white"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {bestsellers.length > 0 && activeCategory === "all" && !search && (
              <section className="px-4 pb-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-800">
                  Más vendidos
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {bestsellers.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      companyId={company.id}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3 px-4">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No hay productos en esta categoría
                </p>
              ) : (
                filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    companyId={company.id}
                  />
                ))
              )}
            </section>
          </div>

          {cart.length > 0 && (
            <FloatingBar
              amount={formatCurrency(total)}
              actionLabel="VER CARRITO"
              onAction={() => router.push(`/menu/${company.id}/cart`)}
            />
          )}
        </>
      )}
    </div>
  );
}
