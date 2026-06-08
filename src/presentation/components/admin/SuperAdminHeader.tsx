"use client";

import { useCompany } from "@/presentation/providers/CompanyProvider";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";

export function SuperAdminHeader() {
  const { user, signOut } = useCompany();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-4 py-3 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-sm text-brand-blue underline">
          ← Panel del negocio
        </Link>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/profile"
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            {user.avatarUrl && (
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image src={user.avatarUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <span className="hidden sm:inline">{user.email}</span>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="text-red-600"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Salir
          </Button>
        </div>
      )}
    </header>
  );
}
