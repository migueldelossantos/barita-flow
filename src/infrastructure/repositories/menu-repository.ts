import type { CompanyWithProfile } from "@/domain/entities/company";
import type {
  Category,
  Product,
  ProductTopping,
  ProductWithDetails,
} from "@/domain/entities/product";
import type { LicenseType } from "@/domain/enums";
import type { ToppingMode } from "@/domain/enums";
import { createClient } from "../supabase/client";

function mapCompany(row: Record<string, unknown>, profile: Record<string, unknown> | null): CompanyWithProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    licenseType: row.license_type as LicenseType,
    licenseExpiresAt: row.license_expires_at as string,
    isSetupComplete: row.is_setup_complete as boolean,
    profile: profile
      ? {
          companyId: profile.company_id as string,
          slogan: profile.slogan as string | null,
          logoUrl: profile.logo_url as string | null,
          bannerUrl: profile.banner_url as string | null,
          address: profile.address as string | null,
          latitude: profile.latitude as number | null,
          longitude: profile.longitude as number | null,
          whatsappPhone: profile.whatsapp_phone as string | null,
          transferOwnerName: profile.transfer_owner_name as string | null,
          transferBank: profile.transfer_bank as string | null,
          transferClabe: profile.transfer_clabe as string | null,
        }
      : null,
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: row.name as string,
    shortName: row.short_name as string,
    description: row.description as string | null,
    sortOrder: row.sort_order as number,
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    categoryId: row.category_id as string | null,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    price: Number(row.price),
    imageUrl: row.image_url as string | null,
    isActive: row.is_active as boolean,
    isBestseller: row.is_bestseller as boolean,
    salesCount: row.sales_count as number,
  };
}

export class MenuRepository {
  private supabase = createClient();

  async getCompany(companyId: string): Promise<CompanyWithProfile | null> {
    const { data: company, error } = await this.supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error || !company) return null;

    const { data: profile } = await this.supabase
      .from("company_profiles")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    return mapCompany(company, profile);
  }

  async getCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order");

    if (error || !data) return [];
    return data.map(mapCategory);
  }

  async getProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("id, name, description, price, image_url, category_id, is_bestseller")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (error || !data) return [];
    return data.map(mapProduct);
  }

  async getBestsellers(companyId: string, limit = 6): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("sales_count", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(mapProduct);
  }

  async getProductWithDetails(productId: string): Promise<ProductWithDetails | null> {
    const { data: product, error } = await this.supabase
      .from("products")
      .select("*, categories(*)")
      .eq("id", productId)
      .single();

    if (error || !product) return null;

    const { data: toppings } = await this.supabase
      .from("product_toppings")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");

    const { data: addonLinks } = await this.supabase
      .from("product_addons")
      .select("addon_product_id, sort_order")
      .eq("product_id", productId)
      .order("sort_order");

    let addonProducts: Product[] = [];
    if (addonLinks?.length) {
      const ids = addonLinks.map((a) => a.addon_product_id);
      const { data: addons } = await this.supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("is_active", true);
      addonProducts = (addons ?? []).map(mapProduct);
    }

    const categories = product.categories as Record<string, unknown> | null;

    return {
      ...mapProduct(product),
      category: categories ? mapCategory(categories) : null,
      toppings: (toppings ?? []).map((t) => ({
        id: t.id,
        productId: t.product_id,
        name: t.name,
        mode: t.mode as ToppingMode,
        sortOrder: t.sort_order,
        variantId: t.variant_id,
        maxSelectable: t.max_selectable
      })),
      variants: [],
      addonProducts,
    };
  }

  async validateCoupon(
    companyId: string,
    code: string
  ): Promise<{ discountPercent?: number; discountAmount?: number; allowedProductIds: string[] } | null> {
    const { data } = await this.supabase
      .from("coupons")
      .select("id, discount_percent, discount_amount, expires_at")
      .eq("company_id", companyId)
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

    const { data: productRows } = await this.supabase
      .from("coupon_products")
      .select("product_id")
      .eq("coupon_id", data.id);

    return {
      discountPercent: data.discount_percent
        ? Number(data.discount_percent)
        : undefined,
      discountAmount: data.discount_amount
        ? Number(data.discount_amount)
        : undefined,
      allowedProductIds: (productRows ?? []).map((row) => row.product_id as string),
    };
  }
}

export const menuRepository = new MenuRepository();
