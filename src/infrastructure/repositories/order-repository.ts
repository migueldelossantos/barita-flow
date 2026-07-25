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

    const orderItemRows = payload.items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      return {
        id: crypto.randomUUID(),
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
      };
    });

    if (orderItemRows.length > 0) {
      const { error: orderItemsError } = await this.supabase
        .from("order_items")
        .insert(orderItemRows);

      if (orderItemsError) {
        console.error("createOrder order_items error:", orderItemsError);
        return null;
      }
    }

    const toppingRows = payload.items.flatMap((item, index) => {
      const orderItemId = orderItemRows[index]?.id;
      if (!orderItemId) return [];

      return item.toppings.map((t) => ({
        order_item_id: orderItemId,
        topping_name: t.name,
        is_selected: t.isSelected,
      }));
    });

    if (toppingRows.length > 0) {
      const { error: toppingError } = await this.supabase
        .from("order_item_toppings")
        .insert(toppingRows);

      if (toppingError) {
        console.error("createOrder order_item_toppings error:", toppingError);
        return null;
      }
    }

    return { id: order.id, orderNumber: order.order_number };
  }
}

export const orderRepository = new OrderRepository();
