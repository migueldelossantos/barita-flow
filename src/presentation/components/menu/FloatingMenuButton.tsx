"use client";

import { cn } from "@/lib/cn";
import { MapPin, Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FloatingMenuButtonProps {
  companyId: string;
  cartCount: number;
  address: string | null;
}

export function FloatingMenuButton({
  companyId,
  cartCount,
  address,
}: FloatingMenuButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-100"
        aria-label="Menú"
      >
        {open ? (
          <X className="h-5 w-5 text-gray-700" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed right-4 top-16 z-50 min-w-[180px] rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-100">
            {address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <MapPin className="h-4 w-4 text-brand-blue" />
                Ubicación
              </a>
            )}
            <Link
              href={`/menu/${companyId}/cart`}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <ShoppingCart className="h-4 w-4 text-brand-green" />
              Carrito
              {cartCount > 0 && (
                <span className="ml-auto rounded-full bg-brand-green px-2 py-0.5 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </>
      )}
    </>
  );
}
