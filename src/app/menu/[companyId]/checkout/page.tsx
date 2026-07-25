import { CheckoutClient } from "@/presentation/components/menu/CheckoutClient";
import { MenuClosedNotice } from "@/presentation/components/menu/MenuClosedNotice";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
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

  const menuEnabled = profile?.menu_enabled ?? true;

  if (!menuEnabled) {
    return (
      <MenuClosedNotice
        companyName={company.name}
        openingTime={profile?.menu_open_time}
        closingTime={profile?.menu_close_time}
      />
    );
  }

  return (
    <CheckoutClient
      company={{
        id: company.id,
        name: company.name,
        phone: company.phone,
        licenseType: company.license_type,
        licenseExpiresAt: company.license_expires_at,
        isSetupComplete: company.is_setup_complete,
        profile: profile
          ? {
              companyId: profile.company_id,
              slogan: profile.slogan,
              logoUrl: profile.logo_url,
              bannerUrl: profile.banner_url,
              address: profile.address,
              latitude: profile.latitude,
              longitude: profile.longitude,
              whatsappPhone: profile.whatsapp_phone,
              transferOwnerName: profile.transfer_owner_name,
              transferBank: profile.transfer_bank,
              transferClabe: profile.transfer_clabe,
              menuEnabled: profile.menu_enabled,
              menuOpenTime: profile.menu_open_time,
              menuCloseTime: profile.menu_close_time,
            }
          : null,
      }}
    />
  );
}
