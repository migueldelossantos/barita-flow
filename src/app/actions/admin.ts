"use server";

import type { DeliveryMethod, PaymentMethod, ToppingMode } from "@/domain/enums";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { formatCurrency } from "@/lib/format";
import { generateProductCode } from "@/lib/product-code";
import { revalidatePath } from "next/cache";

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { CartToppingSelection } from "@/domain/entities/order";

const execAsync = promisify(exec);

export interface VariantInput {
  id?: string,
  name: string,
  price: number
}

export interface ToppingInput {
  name: string;
  mode: ToppingMode;
  variantId: string | null;
  maxSelectable: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  variants: VariantInput[]
  toppings: ToppingInput[];
}

export interface CouponInput {
  id?: string;
  code: string;
  discountType: "percent" | "amount";
  discountValue: number;
  isActive: boolean;
  expiresAt: string | null;
  productIds: string[];
}

export interface ThermalTicketItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  specialInstructions?: string | null;
  toppings: CartToppingSelection[];
}

export interface PrintThermalTicketInput {
  companyName: string;
  orderNumber: number;
  deliveryMethod: DeliveryMethod;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  paymentMethod: PaymentMethod;
  cashAmount?: number | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  comments?: string | null;
  items: ThermalTicketItem[];
}

class BufferAdapter {
  public buffer: Buffer;

  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  open(callback?: (error: any) => void) {
    if (callback) callback(null);
    return this;
  }

  write(data: Buffer, callback?: (error: any) => void) {
    this.buffer = Buffer.concat([this.buffer, data]);
    if (callback) callback(null);
    return this;
  }

  close(callback?: (error: any) => void) {
    if (callback) callback(null);
    return this;
  }
}

async function getMemberCompanyId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!member) throw new Error("Sin empresa vinculada");
  return { supabase, companyId: member.company_id as string };
}

export async function saveCategory(
  companyId: string,
  data: {
    id?: string;
    name: string;
    shortName: string;
    description: string;
  }
) {
  const { supabase } = await getMemberCompanyId();

  if (data.id) {
    const { error } = await supabase
      .from("categories")
      .update({
        name: data.name,
        short_name: data.shortName,
        description: data.description || null,
      })
      .eq("id", data.id)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("categories").insert({
      company_id: companyId,
      name: data.name,
      short_name: data.shortName,
      description: data.description || null,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/dashboard/categories");
}

export async function deleteCategory(companyId: string, categoryId: string) {
  const { supabase } = await getMemberCompanyId();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (count && count > 0) {
    throw new Error("No se puede eliminar: hay productos en esta categoría");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard/categories");
}

export async function saveProduct(
  companyId: string,
  productId: string | null,
  data: ProductInput,
  code?: string
) {
  const { supabase } = await getMemberCompanyId();

  let pid = productId;

  if (pid) {
    const { error } = await supabase
      .from("products")
      .update({
        name: data.name,
        description: data.description || null,
        price: data.price || (data.variants ?? [])[0]?.price,
        category_id: data.categoryId,
        image_url: data.imageUrl,
        is_active: data.isActive,
      })
      .eq("id", pid)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);

    const variantIdsToKeep = data.variants.map(v => v.id).filter(Boolean);
    if (variantIdsToKeep.length > 0) {
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .not("id", "in", `(${variantIdsToKeep.join(",")})`);
    } else {
      await supabase.from("product_variants").delete().eq("product_id", productId);
    }

    if (data.variants.length > 0) {
      const variantsPayload = data.variants.map(v => ({
        id: v.id,
        product_id: productId,
        name: v.name,
        price: v.price,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .upsert(variantsPayload);

      if (variantError) throw new Error(`Error en variantes: ${variantError.message}`);
    }

    await supabase.from("product_toppings").delete().eq("product_id", pid);

    if (data.toppings.length > 0) {
      const toppingsPayload = data.toppings.map((t) => ({
        product_id: productId,
        name: t.name,
        mode: t.mode,
        variant_id: t.variantId,
        max_selectable: t.maxSelectable,
      }));

      const { error: toppingError } = await supabase
        .from("product_toppings")
        .insert(toppingsPayload);

      if (toppingError) throw new Error(`Error en toppings: ${toppingError.message}`);
    }
  } else {
    const { data: existing } = await supabase
      .from("products")
      .select("code")
      .eq("company_id", companyId);

    const codes = (existing ?? []).map((p) => p.code);
    const newCode = code ?? generateProductCode(data.name, codes);

    const { data: created, error } = await supabase
      .from("products")
      .insert({
        company_id: companyId,
        code: codes.includes(newCode) ? `${newCode}-${codes.length}` : newCode,
        name: data.name,
        description: data.description || null,
        price: data.price,
        category_id: data.categoryId,
        image_url: data.imageUrl,
        is_active: data.isActive,
      })
      .select("id")
      .single();

    if (error || !created) throw new Error(error?.message ?? "Error al crear");
    pid = created.id;

    if (data.variants.length > 0) {
      const variantsPayload = data.variants.map(v => ({
        id: v.id,
        product_id: created.id,
        name: v.name,
        price: v.price,
      }));
      await supabase.from("product_variants").insert(variantsPayload);
    }

    if (data.toppings.length > 0) {
      const toppingsPayload = data.toppings.map((t) => ({
        product_id: created.id,
        name: t.name,
        mode: t.mode,
        variant_id: t.variantId,
        max_selectable: t.maxSelectable,
      }));
      await supabase.from("product_toppings").insert(toppingsPayload);
    }
  }

  revalidatePath("/admin/dashboard/products");
  return pid;
}

export async function deleteProduct(companyId: string, productId: string) {
  const { supabase } = await getMemberCompanyId();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard/products");
}

export async function toggleProductActive(
  companyId: string,
  productId: string,
  isActive: boolean
) {
  const { supabase } = await getMemberCompanyId();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard/products");
}

export async function advanceOrderStatus(
  companyId: string,
  orderId: string,
  nextStatus: string
) {
  const { supabase } = await getMemberCompanyId();
  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard/orders");
}

export async function saveCoupon(
  companyId: string,
  data: CouponInput
) {
  const { supabase } = await getMemberCompanyId();
  const code = data.code.trim().toUpperCase();

  if (!code) throw new Error("El codigo del cupon es obligatorio");
  if (data.discountType === "percent" && (data.discountValue <= 0 || data.discountValue > 100)) {
    throw new Error("El porcentaje debe estar entre 1 y 100");
  }
  if (data.discountType === "amount" && data.discountValue <= 0) {
    throw new Error("El monto de descuento debe ser mayor a 0");
  }

  const couponPayload = {
    company_id: companyId,
    code,
    discount_percent: data.discountType === "percent" ? data.discountValue : null,
    discount_amount: data.discountType === "amount" ? data.discountValue : null,
    is_active: data.isActive,
    expires_at: data.expiresAt || null,
  };

  let couponId = data.id ?? null;

  if (couponId) {
    const { error } = await supabase
      .from("coupons")
      .update(couponPayload)
      .eq("id", couponId)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
  } else {
    const { data: created, error } = await supabase
      .from("coupons")
      .insert(couponPayload)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Error al crear cupon");
    couponId = created.id;
  }

  if (!couponId) throw new Error("No se pudo guardar el cupon");

  await supabase.from("coupon_products").delete().eq("coupon_id", couponId);

  if (data.productIds.length > 0) {
    const rows = data.productIds.map((productId) => ({
      coupon_id: couponId,
      product_id: productId,
    }));
    const { error } = await supabase.from("coupon_products").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/dashboard/promotions");
}

export async function deleteCoupon(companyId: string, couponId: string) {
  const { supabase } = await getMemberCompanyId();
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard/promotions");
}

function wrapText(text: string, limit = 32) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    if ((currentLine + " " + word).length <= limit) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

function formatTicketLine(left: string, right: string, width = 32) {
  const trimmedLeft = left.trim();
  const trimmedRight = right.trim();
  const available = Math.max(1, width - trimmedRight.length - 1);
  const label = trimmedLeft.length > available
    ? `${trimmedLeft.slice(0, Math.max(0, available - 3)).trimEnd()}...`
    : trimmedLeft;
  return `${label.padEnd(width - trimmedRight.length - 1)} ${trimmedRight}`;
}

export async function printThermalTicket(data: PrintThermalTicketInput) {

  const escpos = eval("require('escpos')");
  const device = new BufferAdapter();
  const options = { encoding: "GB18030" };
  const printer = new escpos.Printer(device, options);

  const lines: string[] = [];
  lines.push(data.companyName.toUpperCase());
  lines.push(`PEDIDO #${data.orderNumber}`);
  lines.push(new Date().toLocaleString("es-MX"));
  lines.push("--------------------------------");
  lines.push(`Cliente: ${data.customerName}`);
  lines.push(`Telefono: ${data.customerPhone}`);
  lines.push(`Entrega: ${data.deliveryMethod}`);
  if (data.customerAddress) lines.push(`Direccion: ${data.customerAddress}`);
  lines.push("--------------------------------");
  lines.push("ARTICULOS");

  for (const item of data.items) {
    const lineTotal = typeof item.lineTotal === "number"
      ? item.lineTotal
      : item.unitPrice * item.quantity;
    const itemNameLines = wrapText(`${item.quantity}x ${item.productName}`);
    lines.push(...itemNameLines);
    const itemTopping = wrapText(`${item.toppings.filter(i => i.isSelected).reduce((str, value) => { return str += value.name }, '( ')} )`)
    lines.push(...itemTopping);
    lines.push(`  ${formatCurrency(lineTotal)}`);
    if (item.specialInstructions?.trim()) {
      lines.push(`  Nota: ${item.specialInstructions.trim()}`);
    }
  }

  lines.push("--------------------------------");
  lines.push(formatTicketLine("Subtotal", formatCurrency(data.subtotal)));
  if (data.discountAmount > 0) {
    lines.push(formatTicketLine("Descuento", `-${formatCurrency(data.discountAmount)}`));
  }
  lines.push(formatTicketLine("Total", formatCurrency(data.total)));
  lines.push(formatTicketLine("Pago", data.paymentMethod === "cash" ? "Efectivo" : "Transferencia"));
  if (data.paymentMethod === "cash" && typeof data.cashAmount === "number") {
    lines.push(formatTicketLine("Recibido", formatCurrency(data.cashAmount)));
    lines.push(formatTicketLine("Cambio", formatCurrency(Math.max(0, data.cashAmount - data.total))));
  }
  if (data.comments?.trim()) {
    lines.push("--------------------------------");
    lines.push("Comentarios:");
    lines.push(...wrapText(data.comments.trim()));
  }
  lines.push("--------------------------------");
  lines.push("Gracias por su compra");

  await new Promise<void>((resolve, reject) => {
    device.open(async (error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }

      printer
        .align("LT")
        .font("a")
        .text(lines.join("\n"))
        .feed(2)
        .cut()
        .close();

      // resolve();
      try {
        const tempFilePath = path.join(os.tmpdir(), `report_${Date.now()}.bin`);
        await fs.writeFile(tempFilePath, device.buffer);

        const command = `copy /B "${tempFilePath}" "\\\\localhost\\TICKETS"`;
        await execAsync(command);

        await fs.unlink(tempFilePath).catch(() => {});
        resolve();
      } catch (e: any) {
        console.error("Error enviando el reporte a la impresora:", e);
        reject(new Error("No se pudo imprimir el reporte."));
      }
    });
  });
}

export async function saveCompanyProfile(
  companyId: string,
  data: {
    name: string;
    slogan: string;
    address: string;
    whatsappPhone: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    transferOwnerName: string;
    transferBank: string;
    transferClabe: string;
    isSetupComplete?: boolean;
  }
) {
  const { supabase } = await getMemberCompanyId();

  await supabase
    .from("companies")
    .update({ name: data.name, is_setup_complete: data.isSetupComplete ?? true })
    .eq("id", companyId);

  const { data: existing } = await supabase
    .from("company_profiles")
    .select("company_id")
    .eq("company_id", companyId)
    .maybeSingle();

  const profile = {
    slogan: data.slogan || null,
    address: data.address || null,
    whatsapp_phone: data.whatsappPhone || null,
    logo_url: data.logoUrl,
    banner_url: data.bannerUrl,
    transfer_owner_name: data.transferOwnerName || null,
    transfer_bank: data.transferBank || null,
    transfer_clabe: data.transferClabe || null,
  };

  if (existing) {
    const { error } = await supabase
      .from("company_profiles")
      .update(profile)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_profiles").insert({
      company_id: companyId,
      ...profile,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/dashboard/company");
}
