"use server";

import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { createServiceRoleClient } from "@/infrastructure/supabase/admin";
import type { LicenseType } from "@/domain/enums";
import { revalidatePath } from "next/cache";

async function assertSystemAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: admin } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) throw new Error("No autorizado");
  return user;
}

export async function createCompany(data: {
  name: string;
  phone: string;
  licenseType: LicenseType;
  ownerEmail?: string;
}) {
  await assertSystemAdmin();

  const service = createServiceRoleClient();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { data: company, error } = await service
    .from("companies")
    .insert({
      name: data.name,
      phone: data.phone.replace(/\D/g, ""),
      license_type: data.licenseType,
      license_expires_at: expiresAt.toISOString(),
      is_setup_complete: false,
    })
    .select("id")
    .single();

  if (error || !company) throw new Error(error?.message ?? "Error al crear empresa");

  await service.from("company_profiles").insert({
    company_id: company.id,
    whatsapp_phone: data.phone.replace(/\D/g, ""),
  });

  if (data.ownerEmail) {
    const { data: users } = await service.auth.admin.listUsers();
    const owner = users?.users?.find(
      (u) => u.email?.toLowerCase() === data.ownerEmail?.toLowerCase()
    );
    if (owner) {
      await service.from("company_members").insert({
        company_id: company.id,
        user_id: owner.id,
        role: "owner",
      });
    }
  }

  revalidatePath("/super-admin");
  return { id: company.id as string };
}

export async function updateCompanyLicense(
  companyId: string,
  licenseType: LicenseType,
  extendMonths = 1
) {
  await assertSystemAdmin();
  const service = createServiceRoleClient();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + extendMonths);

  const { error } = await service
    .from("companies")
    .update({
      license_type: licenseType,
      license_expires_at: expiresAt.toISOString(),
    })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/super-admin");
}

export async function linkMemberToCompany(
  companyId: string,
  userEmail: string
) {
  await assertSystemAdmin();
  const service = createServiceRoleClient();
  const { data: users } = await service.auth.admin.listUsers();
  const user = users?.users?.find(
    (u) => u.email?.toLowerCase() === userEmail.toLowerCase()
  );
  if (!user) throw new Error("Usuario no encontrado. Debe iniciar sesión al menos una vez.");

  const { error } = await service.from("company_members").upsert({
    company_id: companyId,
    user_id: user.id,
    role: "owner",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/super-admin");
}

export async function resolveLicenseRequest(
  requestId: string,
  decision: "approved" | "rejected",
  adminNote = ""
) {
  const admin = await assertSystemAdmin();
  const service = createServiceRoleClient();
  const { data: request, error: requestError } = await service
    .from("license_requests")
    .select("id, company_id, requested_license, status")
    .eq("id", requestId)
    .single();
  if (requestError || !request) throw new Error("Solicitud no encontrada.");
  if (request.status !== "pending") throw new Error("Esta solicitud ya fue atendida.");

  if (decision === "approved") {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    const { error } = await service.from("companies").update({
      license_type: request.requested_license,
      license_expires_at: expiresAt.toISOString(),
    }).eq("id", request.company_id);
    if (error) throw new Error(error.message);
  }

  const { error } = await service.from("license_requests").update({
    status: decision,
    admin_note: adminNote || null,
    resolved_by: admin.id,
    resolved_at: new Date().toISOString(),
  }).eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/super-admin");
  revalidatePath("/admin/dashboard/licenses");
}
