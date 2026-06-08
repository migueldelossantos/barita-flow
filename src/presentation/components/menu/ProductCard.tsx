import { formatCurrency } from "@/lib/format";
import type { Product } from "@/domain/entities/product";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  companyId: string;
  compact?: boolean;
}

export function ProductCard({ product, companyId, compact }: ProductCardProps) {
  const href = `/menu/${companyId}/product/${product.id}`;
  const imageSrc =
    product.imageUrl ??
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

  if (compact) {
    return (
      <Link
        href={href}
        className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-2 w-24 shadow-sm"
      >
        <div className="relative h-16 w-16 overflow-hidden rounded-lg">
          <Image src={imageSrc} alt={product.name} fill className="object-cover" />
        </div>
        <span className="line-clamp-2 text-center text-xs font-medium text-gray-800">
          {product.name}
        </span>
        <span className="text-xs font-semibold text-brand-green">
          {formatCurrency(product.price)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        <Image src={imageSrc} alt={product.name} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-gray-500">
            {product.description}
          </p>
        )}
        <p className="mt-1 font-semibold text-brand-green">
          {formatCurrency(product.price)}
        </p>
      </div>
    </Link>
  );
}
