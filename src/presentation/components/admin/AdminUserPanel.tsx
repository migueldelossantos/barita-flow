"use client";

import { cn } from "@/lib/cn";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AdminUserPanelProps {
  collapsed?: boolean;
}

export function AdminUserPanel({ collapsed }: AdminUserPanelProps) {
  const { user, loading, signOut } = useCompany();

  if (loading) {
    return (
      <div className="border-t p-3">
        <p className="text-xs text-gray-400">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border-t p-3">
        <Link
          href="/admin"
          className="text-sm text-brand-blue underline"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t p-2">
      <Link
        href="/admin/dashboard/profile"
        className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50",
          collapsed && "justify-center"
        )}
        title={user.email ?? undefined}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-blue/10">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-blue">
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.name ?? "Usuario"}
            </p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        )}
        {!collapsed && <User className="h-4 w-4 shrink-0 text-gray-400" />}
      </Link>

      <button
        type="button"
        onClick={() => signOut()}
        className={cn(
          "mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 transition-colors hover:bg-red-50",
          collapsed && "justify-center"
        )}
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </div>
  );
}
