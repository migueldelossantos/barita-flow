import { MenuPageClient } from "@/presentation/components/menu/MenuPageClient";
import { MenuClosedNotice } from "@/presentation/components/menu/MenuClosedNotice";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function MenuPage({ params }: PageProps) {
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  const { data: bestsellers } = await supabase
    .from("products")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("sales_count", { ascending: false })
    .limit(6);

  const companyMapped = {
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
  };

  const mapCategory = (c: Record<string, unknown>) => ({
    id: c.id as string,
    companyId: c.company_id as string,
    name: c.name as string,
    shortName: c.short_name as string,
    description: c.description as string | null,
    sortOrder: c.sort_order as number,
  });

  const mapProduct = (p: Record<string, unknown>) => ({
    id: p.id as string,
    companyId: p.company_id as string,
    categoryId: p.category_id as string | null,
    code: p.code as string,
    name: p.name as string,
    description: p.description as string | null,
    price: Number(p.price),
    imageUrl: p.image_url as string | null,
    isActive: p.is_active as boolean,
    isBestseller: p.is_bestseller as boolean,
    salesCount: p.sales_count as number,
  });

  return (
    <MenuPageClient
      company={companyMapped}
      categories={(categories ?? []).map(mapCategory)}
      products={(products ?? []).map(mapProduct)}
      bestsellers={(bestsellers ?? []).map(mapProduct)}
    />
  );
}
