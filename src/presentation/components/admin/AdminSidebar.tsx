"use client";

import { cn } from "@/lib/cn";
import {
  Building2,
  LayoutDashboard,
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
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const { isSystemAdmin } = useCompany();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-white transition-all",
        open ? "w-56" : "w-16"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-800"
      >
        {open ? "≡ Menú" : "≡"}
      </button>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname === href ||
                (href !== "/admin/dashboard" && pathname.startsWith(href + "/"))
                ? "bg-brand-green/10 text-brand-green"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {open && <span>{label}</span>}
          </Link>
        ))}
        {isSystemAdmin && (
          <Link
            href="/super-admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-amber-700 hover:bg-amber-50"
          >
            <Shield className="h-5 w-5 shrink-0" />
            {open && <span>Super Admin</span>}
          </Link>
        )}
      </nav>
      <AdminUserPanel collapsed={!open} />
    </aside>
  );
}
