import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
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
  }

  return NextResponse.redirect(`${origin}/admin/dashboard`);
}
