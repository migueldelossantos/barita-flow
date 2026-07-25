import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { MenuClosedNotice } from "@/presentation/components/menu/MenuClosedNotice";
import { CartPageClient } from "@/presentation/components/menu/CartPageClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CartPage({ params }: PageProps) {
  const { companyId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!company) notFound();

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if ((profile?.menu_enabled ?? true) === false) {
    return (
      <MenuClosedNotice
        companyName={company.name}
        openingTime={profile?.menu_open_time}
        closingTime={profile?.menu_close_time}
      />
    );
  }

  return <CartPageClient companyId={companyId} />;
}
