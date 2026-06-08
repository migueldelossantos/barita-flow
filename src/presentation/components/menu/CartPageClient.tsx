"use client";

import type { CartItem } from "@/domain/entities/order";
import { formatCurrency } from "@/lib/format";
import { useOrderSession } from "@/presentation/stores/order-session-store";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { FloatingBar } from "../ui/FloatingBar";

interface CartPageClientProps {
  companyId: string;
}

function ItemDescription({ item }: { item: CartItem }) {
  const toppings = item.toppings
    .filter((t) => t.isSelected)
    .map((t) => t.name)
    .join(", ");
  const addons = item.addons
    .map((a) => `${a.quantity}x ${a.name}`)
    .join(", ");
  return (
    <div className="space-y-1 text-sm text-gray-600">
      {toppings && <p>Toppings: {toppings}</p>}
      {addons && <p>Extras: {addons}</p>}
      {item.specialInstructions && (
        <p>Nota: {item.specialInstructions}</p>
      )}
    </div>
  );
}

export function CartPageClient({ companyId }: CartPageClientProps) {
  const router = useRouter();
  const { cart, removeFromCart, cartTotal } = useOrderSession();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const total = cartTotal();

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">Tu carrito está vacío</p>
        <Link
          href={`/menu/${companyId}`}
          className="text-brand-blue underline"
        >
          Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="flex items-center gap-3 border-b px-4 py-4">
        <Link href={`/menu/${companyId}`}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Pedido</h1>
      </header>

      <div className="overflow-x-auto px-4 py-4">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500">
              <th className="pb-2 pr-2 w-10">#</th>
              <th className="pb-2">Producto</th>
              <th className="pb-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <Fragment key={item.id}>
                <tr className="border-b align-top">
                  <td className="py-3 pr-2 font-medium">{item.quantity}</td>
                  <td className="py-3">
                    <p className="font-medium">{item.productName}</p>
                    <p className="font-bold text-brand-green">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/menu/${companyId}/product/${item.productId}?edit=${item.id}`}
                        className="p-1 text-gray-500 hover:text-brand-blue"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((e) => ({
                            ...e,
                            [item.id]: !e[item.id],
                          }))
                        }
                        className="p-1 text-gray-500"
                      >
                        {expanded[item.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded[item.id] && (
                  <tr>
                    <td colSpan={3} className="pb-3 pl-10">
                      <ItemDescription item={item} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <FloatingBar
        amount={formatCurrency(total)}
        actionLabel="Continuar"
        onAction={() => router.push(`/menu/${companyId}/checkout`)}
      />
    </div>
  );
}
