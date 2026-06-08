"use client";

import { useCompany } from "@/presentation/providers/CompanyProvider";
import { LogOut, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";

export function UserProfileClient() {
  const { user, company, isSystemAdmin, loading, signOut } = useCompany();

  if (loading) {
    return <p className="text-gray-500">Cargando perfil...</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">No hay sesión activa.</p>
        <Link href="/admin">
          <Button variant="blue">Iniciar sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-brand-blue/10">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand-blue">
                {(user.name ?? "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {user.name ?? "Usuario"}
            </p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 border-t pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">ID de cuenta</dt>
            <dd className="truncate font-mono text-xs text-gray-800">
              {user.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Proveedor</dt>
            <dd className="text-gray-800">Google</dd>
          </div>
          {isSystemAdmin && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Rol</dt>
              <dd className="flex items-center gap-1 font-medium text-amber-700">
                <Shield className="h-4 w-4" />
                Super administrador
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Negocio vinculado</dt>
            <dd className="text-right text-gray-800">
              {company?.name ?? (
                <span className="text-gray-400">Sin vincular</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          fullWidth
          onClick={() => signOut()}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
        {isSystemAdmin && (
          <Link href="/super-admin" className="flex-1">
            <Button variant="blue" fullWidth type="button">
              Ir a Super Admin
            </Button>
          </Link>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Al cerrar sesión deberás volver a autenticarte con Google para acceder
        al panel.
      </p>
    </div>
  );
}
