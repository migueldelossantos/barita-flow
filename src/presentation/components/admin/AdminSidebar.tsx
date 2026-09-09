"use client";

import { cn } from "@/lib/cn";
import {
  Building2,
  LayoutDashboard,
  CreditCard,
  Menu,
  Package,
  Shield,
  ShoppingBag,
  Tag,
  User,
} from "lucide-react";
import { AdminUserPanel } from "./AdminUserPanel";
import Link from "next/link";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/products", label: "Productos", icon: Package },
  { href: "/admin/dashboard/promotions", label: "Promociones", icon: Tag },
  { href: "/admin/dashboard/orders", label: "Órdenes", icon: ShoppingBag },
  { href: "/admin/dashboard/categories", label: "Categorías", icon: Menu },
  { href: "/admin/dashboard/company", label: "Mi empresa", icon: Building2 },
  { href: "/admin/dashboard/profile", label: "Mi perfil", icon: User },
  { href: "/admin/dashboard/licenses", label: "Licencias", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isSystemAdmin } = useCompany();

  return (
    <>
      {!open && <button type="button" onClick={() => setOpen(true)} className="fixed left-3 top-3 z-30 rounded-lg border bg-white px-3 py-2 text-sm font-semibold shadow md:hidden">≡ Menú</button>}
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white shadow-xl transition-all md:sticky md:shadow-none",
        open ? "w-56 translate-x-0" : "w-56 -translate-x-full md:w-16 md:translate-x-0"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-800"
      >
        {open ? "≡ Menú" : "≡"}
      </button>
      <nav className="flex-1 space-y-1 overflow-visible p-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-label={label}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname === href ||
                (href !== "/admin/dashboard" && pathname.startsWith(href + "/"))
                ? "bg-brand-green/10 text-brand-green"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {open && <span>{label}</span>}
            {!open && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus:block">{label}</span>}
          </Link>
        ))}
        {isSystemAdmin && (
          <Link
            href="/super-admin"
            onClick={() => setOpen(false)}
            aria-label="Super Admin"
            className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-amber-700 hover:bg-amber-50"
          >
            <Shield className="h-5 w-5 shrink-0" />
            {open && <span>Super Admin</span>}
            {!open && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus:block">Super Admin</span>}
          </Link>
        )}
      </nav>
      <AdminUserPanel collapsed={!open} />
    </aside>
    </>
  );
}
