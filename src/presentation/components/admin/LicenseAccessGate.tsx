"use client";

import { useCompany } from "@/presentation/providers/CompanyProvider";
import { LicensePlansClient } from "./LicensePlansClient";

export function LicenseAccessGate({ children }: { children: React.ReactNode }) {
  const { company, loading } = useCompany();
  if (loading) return <main className="p-4 sm:p-6">Cargando…</main>;
  if (company && new Date(company.licenseExpiresAt) <= new Date()) {
    return <LicensePlansClient expired />;
  }
  return <>{children}</>;
}
