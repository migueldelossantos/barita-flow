"use client";

import { formatCurrency } from "@/lib/format";
import type { Product } from "@/domain/entities/product";
import { useOrderSession } from "@/presentation/stores/order-session-store";
import { ShoppingCart, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  companyId: string;
  compact?: boolean;
}

export function ProductCard({ product, companyId, compact }: ProductCardProps) {
  const href = `/menu/${companyId}/product/${product.id}`;
  const addToCart = useOrderSession((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const imageSrc = product.imageUrl ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

  const addDefaultProduct = () => {
    addToCart({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: 1,
      toppings: [],
      addons: [],
      specialInstructions: "",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  const prefetchDetail = () => router.prefetch(href);

  const addButton = (
    <button
      type="button"
      onClick={addDefaultProduct}
      aria-label={`Agregar ${product.name} al carrito`}
      title="Agregar al carrito"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-white shadow-sm transition hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
    >
      {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
    </button>
  );

  if (compact) {
    return (
      <div className="relative flex w-24 shrink-0 flex-col rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        <Link href={href} onMouseEnter={prefetchDetail} onTouchStart={prefetchDetail} className="flex flex-col items-center gap-1">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg">
            <Image src={imageSrc} alt={product.name} fill className="object-cover" />
          </div>
          <span className="line-clamp-2 text-center text-xs font-medium text-gray-800">{product.name}</span>
          <span className="text-xs font-semibold text-brand-green">{formatCurrency(product.price)}</span>
        </Link>
        <div className="mt-2 self-center">{addButton}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} onMouseEnter={prefetchDetail} onTouchStart={prefetchDetail} className="flex min-w-0 flex-1 gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <Image src={imageSrc} alt={product.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          {product.description && <p className="line-clamp-2 text-sm text-gray-500">{product.description}</p>}
          <p className="mt-1 font-semibold text-brand-green">{formatCurrency(product.price)}</p>
        </div>
      </Link>
      {addButton}
    </div>
  );
}
