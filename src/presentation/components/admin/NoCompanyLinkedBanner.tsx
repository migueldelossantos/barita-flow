"use client";

import { useCompany } from "@/presentation/providers/CompanyProvider";

export function NoCompanyLinkedBanner() {
  const { user, companyId, loading, isSystemAdmin } = useCompany();

  if (loading || !user || companyId || isSystemAdmin) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
      <p className="font-semibold">Tu cuenta aún no está vinculada a un negocio</p>
      <p className="mt-2 text-amber-800">
        Sesión activa: <strong>{user.email}</strong>. Para usar productos, pedidos y
        configuración, el administrador del sistema debe vincular este correo con tu
        empresa en <strong>Super Admin</strong>.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-amber-800">
        <li>El dueño inicia sesión al menos una vez con Google (ya hecho).</li>
        <li>Super Admin crea el negocio o abre uno existente.</li>
        <li>En la columna &quot;Vincular dueño&quot;, ingresa el mismo correo y pulsa OK.</li>
        <li>El dueño recarga el panel o vuelve a entrar.</li>
      </ol>
    </div>
  );
}
