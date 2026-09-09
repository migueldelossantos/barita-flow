import type { LicenseType } from "@/domain/enums";

export type PlanKey = "FREE" | "BASICA" | "PREMIUM";

export const LICENSES: Record<PlanKey, {
  name: string;
  products: number | null;
  orders: number | null;
  promotions: boolean;
  description: string;
}> = {
  FREE: { name: "FREE", products: 10, orders: 100, promotions: false, description: "Configura los datos de tu empresa y publica hasta 10 productos." },
  BASICA: { name: "Básica", products: 50, orders: 1000, promotions: true, description: "Acceso completo al sistema, cupones y ofertas incluidos." },
  PREMIUM: { name: "Premium", products: null, orders: null, promotions: true, description: "Sin límites, dominio propio y ajustes de funcionalidad a la medida." },
};

export function normalizeLicense(type: LicenseType): PlanKey {
  if (type === "BASICA") return "BASICA";
  if (type === "PREMIUM") return "PREMIUM";
  return "FREE";
}
