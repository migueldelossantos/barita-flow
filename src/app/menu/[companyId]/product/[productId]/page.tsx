import { ProductDetailClient } from "@/presentation/components/menu/ProductDetailClient";
import { MenuClosedNotice } from "@/presentation/components/menu/MenuClosedNotice";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { notFound } from "next/navigation";
import type { ProductWithDetails } from "@/domain/entities/product";
import type { ToppingMode } from "@/domain/enums";

interface PageProps {
  params: Promise<{ companyId: string; productId: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { companyId, productId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("id", productId)
    .eq("company_id", companyId)
    .single();

  if (!product) notFound();

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if ((profile?.menu_enabled ?? true) === false) {
    return (
      <MenuClosedNotice
        companyName={company?.name ?? "Menú"}
        openingTime={profile?.menu_open_time}
        closingTime={profile?.menu_close_time}
      />
    );
  }

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");

  const { data: toppings } = await supabase
    .from("product_toppings")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");

  const { data: addonLinks } = await supabase
    .from("product_addons")
    .select("addon_product_id")
    .eq("product_id", productId);
  
  let addonProducts: any[] = [];

  if (addonLinks && addonLinks?.length) {
    const { data: addons } = await supabase
      .from("products")
      .select("*")
      .in(
        "id",
        addonLinks.map((a) => a.addon_product_id)
      );
    if (addons) addonProducts = addons;
  }

  const cat = product.categories as Record<string, unknown> | null;

  const mapped: ProductWithDetails = {
    id: product.id,
    companyId: product.company_id,
    categoryId: product.category_id,
    code: product.code,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.image_url,
    isActive: product.is_active,
    isBestseller: product.is_bestseller,
    salesCount: product.sales_count,
    category: cat
      ? {
          id: cat.id as string,
          companyId: cat.company_id as string,
          name: cat.name as string,
          shortName: cat.short_name as string,
          description: cat.description as string | null,
          sortOrder: cat.sort_order as number,
        }
      : null,
    variants: (variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price
    })),
    toppings: (toppings ?? []).map((t) => ({
      id: t.id,
      productId: t.product_id,
      name: t.name,
      mode: t.mode as ToppingMode,
      sortOrder: t.sort_order,
      variantId: t.variant_id,
      maxSelectable: t.max_selectable
    })),
    addonProducts: addonProducts.map((p) => ({
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
    })),
  };

  return <ProductDetailClient product={mapped} companyId={companyId} />;
}
