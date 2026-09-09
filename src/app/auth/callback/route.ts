import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { createServiceRoleClient } from "@/infrastructure/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error_description") ?? searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(
      `${origin}/admin?error=auth&message=${encodeURIComponent(authError)}`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/admin?error=auth&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id, companies(is_setup_complete)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (member) {
      const raw = member.companies as
        | { is_setup_complete: boolean }
        | { is_setup_complete: boolean }[]
        | null;
      const company = Array.isArray(raw) ? raw[0] : raw;
      if (!company?.is_setup_complete) {
        return NextResponse.redirect(`${origin}/admin/setup`);
      }
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }

    const { data: sysAdmin } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sysAdmin) {
      return NextResponse.redirect(`${origin}/super-admin`);
    }

    // First Google login: create the tenant and make this user its owner.
    // Google OAuth normally does not expose a phone number, so onboarding asks for it.
    try {
      const admin = createServiceRoleClient();
      const metadata = user.user_metadata ?? {};
      const name = String(metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "Mi empresa");
      const phone = String(metadata.phone ?? "Pendiente");
      const { data: company, error: companyError } = await admin
        .from("companies")
        .insert({
          name,
          phone,
          contact_email: user.email ?? null,
          license_type: "FREE",
          // Free onboarding has 30 days of validity; it can be renewed by the administrator.
          license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_setup_complete: false,
        })
        .select("id")
        .single();
      if (companyError || !company) throw new Error(companyError?.message ?? "No se pudo crear la empresa");
      const { error: memberError } = await admin.from("company_members").insert({
        company_id: company.id,
        user_id: user.id,
        role: "owner",
      });
      if (memberError) throw new Error(memberError.message);
      return NextResponse.redirect(`${origin}/admin/setup`);
    } catch (creationError) {
      return NextResponse.redirect(`${origin}/admin?error=auth&message=${encodeURIComponent(
        creationError instanceof Error ? creationError.message : "No se pudo preparar tu cuenta"
      )}`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/dashboard`);
}
