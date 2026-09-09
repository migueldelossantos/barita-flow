import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && path !== "/admin" && !user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // An expired tenant may access only the licensing screen.
  if (path.startsWith("/admin") && path !== "/admin" && !path.startsWith("/admin/dashboard/licenses") && user) {
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (member) {
      const { data: company } = await supabase
        .from("companies")
        .select("license_expires_at")
        .eq("id", member.company_id)
        .maybeSingle();
      if (company && new Date(company.license_expires_at) <= new Date()) {
        return NextResponse.redirect(new URL("/admin/dashboard/licenses", request.url));
      }
    }
  }

  if (path.startsWith("/super-admin") && !user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};
