import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    const msg = encodeURIComponent(error?.message ?? "OAuth no configurado");
    return NextResponse.redirect(`${origin}/admin?error=auth&message=${msg}`);
  }

  return NextResponse.redirect(data.url);
}
