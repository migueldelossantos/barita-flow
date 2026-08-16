"use client";

import type { CompanyWithProfile } from "@/domain/entities/company";
import { DELIVERY_METHOD_LABELS } from "@/domain/enums";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { buildOrderWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { menuRepository } from "@/infrastructure/repositories/menu-repository";
import { orderRepository } from "@/infrastructure/repositories/order-repository";
import { useOrderSession } from "@/presentation/stores/order-session-store";
import { ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingBar } from "../ui/FloatingBar";
import GoogleMapsComponent from '@/presentation/components/menu/MapLocation'

interface CheckoutClientProps {
  company: CompanyWithProfile;
}

export function CheckoutClient({ company }: CheckoutClientProps) {
  const router = useRouter();
  const {
    cart,
    deliveryMethod,
    checkout,
    setCheckout,
    cartTotal,
    clearCart,
  } = useOrderSession();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [into, setInto] = useState(true);

  const [coords, setCoords] = useState<google.maps.LatLngLiteral>();
  const handleCoords = (coords: google.maps.LatLngLiteral, indoor?: Boolean) => {
    setCoords(coords);
    setInto(!!indoor);
    if (!indoor) {
      alert("Lo sentimos, tu ubicación actual está fuera de nuestra zona de servicio.");
    }
  };

  const subtotal = cartTotal();
  const discount = checkout.discountAmount;
  const total = Math.max(0, subtotal - discount);

  const businessPhone =
    company.profile?.whatsappPhone ?? company.phone;

  const applyCoupon = async () => {
    if (!checkout.couponCode.trim()) return;
    setCouponLoading(true);
    const result = await menuRepository.validateCoupon(
      company.id,
      checkout.couponCode
    );
    setCouponLoading(false);
    if (!result) {
      alert("Cupón no válido");
      return;
    }

    const eligibleSubtotal =
      result.allowedProductIds.length === 0
        ? subtotal
        : cart.reduce((sum, item) => {
            if (!result.allowedProductIds.includes(item.productId)) return sum;
            return sum + item.unitPrice * item.quantity;
          }, 0);

    if (eligibleSubtotal <= 0) {
      alert("Este cupón no aplica a los productos que tienes en el carrito");
      return;
    }

    let amount = 0;
    if (result.discountPercent) {
      amount = eligibleSubtotal * (result.discountPercent / 100);
    } else if (result.discountAmount) {
      amount = Math.min(result.discountAmount, eligibleSubtotal);
    }
    setCheckout({ discountAmount: Math.min(amount, subtotal) });
  };

  const copyClabe = () => {
    const clabe = company.profile?.transferClabe ?? "";
    navigator.clipboard.writeText(clabe);
    alert("CLABE copiada");
  };

  const handleSubmit = async () => {
    if (!deliveryMethod || !checkout.customerName || !checkout.customerPhone) {
      return;
    }
    setSubmitting(true);

    const payload = {
      companyId: company.id,
      deliveryMethod,
      customerName: checkout.customerName,
      customerPhone: checkout.customerPhone,
      customerAddress:
        deliveryMethod === "delivery" ? checkout.address : undefined,
      customerLat: coords?.lat,
      customerLng: coords?.lng,
      paymentMethod: checkout.paymentMethod,
      cashAmount:
        checkout.paymentMethod === "cash"
          ? Number(checkout.cashAmount) || total
          : undefined,
      couponCode: checkout.couponCode || undefined,
      discountAmount: discount,
      subtotal,
      total,
      comments: checkout.comments || undefined,
      items: cart,
    };

    orderRepository.createOrder(payload);
    setSubmitting(false);

    const message = buildOrderWhatsAppMessage({
      businessPhone,
      customerName: checkout.customerName,
      orderNumber: 0,
      items: cart,
      subtotal,
      total,
      paymentMethod: checkout.paymentMethod,
      cashAmount: Number(checkout.cashAmount) || total,
      address: checkout.address,
      deliveryMethod,
    });

    const waUrl = getWhatsAppUrl(businessPhone, message);

    clearCart();

    router.push(
      `/menu/${company.id}/success?order=${order.orderNumber}&wa=${encodeURIComponent(waUrl)}&origin=checkout`
    );
  };

  const mapUrl =
    deliveryMethod === "delivery"
      ? `https://maps.google.com/?q=${encodeURIComponent(checkout.address || "")}`
      : company.profile?.address
        ? `https://maps.google.com/?q=${encodeURIComponent(company.profile.address)}`
        : "#";

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="flex items-center gap-3 border-b px-4 py-4">
        <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">
          {step === 3 ? "Último paso" : `Paso ${step} de 3`}
        </h1>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* Step indicators */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full",
                s <= step ? "bg-brand-green" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                value={checkout.customerName}
                onChange={(e) =>
                  setCheckout({ customerName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                  MX +52
                </span>
                <input
                  type="tel"
                  value={checkout.customerPhone}
                  onChange={(e) =>
                    setCheckout({ customerPhone: e.target.value })
                  }
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                  placeholder="5512345678"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {deliveryMethod === "delivery" ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Dirección de entrega
                  </label>
                  <textarea
                    value={checkout.address}
                    onChange={(e) =>
                      setCheckout({ address: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm"
                    placeholder="Calle, número, colonia..."
                  />
                </div>
                <GoogleMapsComponent onLocationChange={handleCoords}/>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  {DELIVERY_METHOD_LABELS[deliveryMethod!]}
                </p>
                <p className="font-medium">
                  {company.profile?.address ?? "Dirección no configurada"}
                </p>
                <GoogleMapsComponent onLocationChange={handleCoords} useLocation={false}/>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 font-semibold">Cupón de descuento</h2>
              <div className="flex gap-2">
                <input
                  value={checkout.couponCode}
                  onChange={(e) =>
                    setCheckout({ couponCode: e.target.value })
                  }
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
                  placeholder="CÓDIGO"
                />
                <Button
                  variant="blue"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                >
                  Aplicar
                </Button>
              </div>
            </section>

            <section className="rounded-lg bg-gray-50 p-4 text-sm">
              <h2 className="mb-3 font-semibold">Detalles del pedido</h2>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-brand-green">
                      <span>Cupón ({checkout.couponCode})</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuento</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  </>
                )}
                <div className="mt-2 flex justify-between rounded-lg bg-brand-green/10 px-3 py-2 font-bold">
                  <span>Total a pagar</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-semibold">Método de pago</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={checkout.paymentMethod === "cash"}
                    onChange={() =>
                      setCheckout({ paymentMethod: "cash" })
                    }
                  />
                  Efectivo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={checkout.paymentMethod === "transfer"}
                    onChange={() =>
                      setCheckout({ paymentMethod: "transfer" })
                    }
                  />
                  Transferencia
                </label>
              </div>

              {checkout.paymentMethod === "cash" ? (
                <div className="mt-3">
                  <label className="mb-1 block text-sm">
                    ¿Con cuánto pagas?
                  </label>
                  <input
                    type="number"
                    value={checkout.cashAmount}
                    onChange={(e) =>
                      setCheckout({ cashAmount: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder={String(total)}
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2 rounded-lg border border-gray-100 p-4 text-sm">
                  <p>
                    <span className="text-gray-500">Nombre: </span>
                    {company.profile?.transferOwnerName ?? "—"}
                  </p>
                  <p>
                    <span className="text-gray-500">Banco: </span>
                    {company.profile?.transferBank ?? "—"}
                  </p>
                  <p>
                    <span className="text-gray-500">CLABE: </span>
                    {company.profile?.transferClabe ?? "—"}
                  </p>
                  <Button variant="blue" size="sm" onClick={copyClabe}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar CLABE
                  </Button>
                </div>
              )}
            </section>

            <section>
              <label className="mb-1 block text-sm font-medium">
                Comentarios
              </label>
              <textarea
                value={checkout.comments}
                onChange={(e) =>
                  setCheckout({ comments: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm"
              />
            </section>
          </div>
        )}
      </div>

      <FloatingBar
        amount={formatCurrency(total)}
        actionLabel={
          step < 3 ? "Continuar" : submitting ? "Enviando..." : "Enviar pedido"
        }
        onAction={() => {
          if (step < 3) setStep(step + 1);
          else handleSubmit();
        }}
        variant={step === 3 ? "blue" : into ? "green" : "ghost"}
      />
    </div>
  );
}
