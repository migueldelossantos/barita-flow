"use client";

import { useCompany } from "@/presentation/providers/CompanyProvider";
import { requestLicenseChange } from "@/app/actions/admin";
import { LICENSES, normalizeLicense, type PlanKey } from "@/lib/licenses";
import { Check, Mail, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";

const planOrder: PlanKey[] = ["FREE", "BASICA", "PREMIUM"];

export function LicensePlansClient({ expired = false }: { expired?: boolean }) {
  const { company } = useCompany();
  const [selected, setSelected] = useState<PlanKey>(company ? normalizeLicense(company.licenseType) : "FREE");
  const [message, setMessage] = useState<string | null>(null);
  const current = company ? normalizeLicense(company.licenseType) : "FREE";

  const request = async () => {
    if (!company) return;
    try {
      await requestLicenseChange(selected, expired);
      setMessage("Tu solicitud fue enviada a Atención a clientes de iToCode.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    }
  };

  if (!company) return <p className="p-6 text-gray-500">No hay empresa vinculada.</p>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {expired && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <ShieldAlert className="mx-auto h-9 w-9 text-red-600" />
          <h1 className="mt-2 text-2xl font-bold text-red-900">Tu licencia venció</h1>
          <p className="mt-1 text-sm text-red-800">El acceso al sistema se reactivará cuando iToCode actualice tu vigencia.</p>
          <Button variant="green" onClick={request} className="mt-4 min-h-12 px-8 text-base">Reactivar licencia</Button>
        </section>
      )}
      {!expired && <div><h1 className="text-2xl font-bold">Licencias</h1><p className="mt-1 text-sm text-gray-600">Administra el plan de {company.name} y conoce sus límites.</p></div>}
      <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
        Licencia actual: <strong>{LICENSES[current].name}</strong> · Vigente hasta <strong>{new Date(company.licenseExpiresAt).toLocaleDateString("es-MX")}</strong>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {planOrder.map((key) => {
          const plan = LICENSES[key];
          const isCurrent = key === current;
          return <article key={key} className={`rounded-2xl border bg-white p-5 shadow-sm ${isCurrent ? "border-brand-green ring-1 ring-brand-green" : "border-gray-200"}`}>
            <h2 className="text-xl font-bold">{plan.name}</h2>
            {isCurrent && <span className="mt-2 inline-block rounded-full bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green">Tu licencia actual</span>}
            <p className="mt-3 min-h-12 text-sm text-gray-600">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><Check className="h-4 w-4 text-brand-green" />{plan.products ? `${plan.products} productos` : "Productos ilimitados"}</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-brand-green" />{plan.orders ? `${plan.orders.toLocaleString("es-MX")} órdenes al mes` : "Órdenes ilimitadas"}</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-brand-green" />{plan.promotions ? "Cupones y ofertas" : "Cupones y ofertas no incluidos"}</li>
              {key === "PREMIUM" && <li className="flex gap-2"><Check className="h-4 w-4 text-brand-green" />Dominio propio: www.miempresa.com/menú/ y ajustes a medida</li>}
            </ul>
            <button type="button" onClick={() => setSelected(key)} className={`mt-5 w-full rounded-lg border px-3 py-2 text-sm font-medium ${selected === key ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-gray-200"}`}>{selected === key ? "Seleccionada" : "Elegir esta licencia"}</button>
          </article>;
        })}
      </div>
      {!expired && <div className="rounded-2xl bg-gray-900 p-5 text-white sm:flex sm:items-center sm:justify-between"><div><h2 className="font-semibold">¿Quieres cambiar de licencia?</h2><p className="mt-1 text-sm text-gray-300">Atención a clientes de iToCode recibirá los datos de tu empresa y la licencia seleccionada.</p></div><Button variant="green" onClick={request} className="mt-4 sm:mt-0"><Mail className="mr-2 h-4 w-4" />Contactar a iToCode</Button></div>}
      {message && <p className="text-center text-sm text-gray-600">{message}</p>}
    </main>
  );
}
