import type { CreateOrderPayload } from "@/domain/entities/order";
import { createClient } from "../supabase/client";

export class OrderRepository {
  private supabase = createClient();

  async createOrder(payload: CreateOrderPayload): Promise<{
    id: string;
    orderNumber: number;
  } | null> {
    const { data: order, error } = await this.supabase
      .from("orders")
      .insert({
        company_id: payload.companyId,
        status: "active",
        delivery_method: payload.deliveryMethod,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_address: payload.customerAddress ?? null,
        customer_lat: payload.customerLat ?? null,
        customer_lng: payload.customerLng ?? null,
        payment_method: payload.paymentMethod,
        cash_amount: payload.cashAmount ?? null,
        coupon_code: payload.couponCode ?? null,
        discount_amount: payload.discountAmount,
        subtotal: payload.subtotal,
        total: payload.total,
        comments: payload.comments ?? null,
      })
      .select("id, order_number")
      .single();

    if (error || !order) {
      console.error("createOrder error:", error);
      return null;
    }

    for (const item of payload.items) {
      const lineTotal = item.unitPrice * item.quantity;
      const { data: orderItem, error: itemError } = await this.supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: lineTotal,
          special_instructions: item.specialInstructions || null,
          configuration: {
            toppings: item.toppings,
            addons: item.addons,
          },
        })
        .select("id")
        .single();

      if (itemError || !orderItem) continue;

      const toppingRows = item.toppings.map((t) => ({
        order_item_id: orderItem.id,
        topping_name: t.name,
        is_selected: t.isSelected,
      }));

      if (toppingRows.length) {
        await this.supabase.from("order_item_toppings").insert(toppingRows);
      }
    }

    return { id: order.id, orderNumber: order.order_number };
  }
}

export const orderRepository = new OrderRepository();
