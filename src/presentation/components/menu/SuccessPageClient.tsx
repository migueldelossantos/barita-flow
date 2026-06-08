"use client";

import { useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface SuccessPageClientProps {
  companyId: string;
  orderNumber: string;
  whatsAppUrl: string;
  origin: string
}

export function SuccessPageClient({
  companyId,
  orderNumber,
  whatsAppUrl,
  origin
}: SuccessPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const hasTriggered = useRef(false);

  useEffect(() => {
    if (whatsAppUrl && origin === "checkout" && !hasTriggered.current) {
      hasTriggered.current = true;

      window.location.href = whatsAppUrl;

      const timer = setTimeout(() => {
        router.replace(`${pathname}?order=${orderNumber}`);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [whatsAppUrl, origin, orderNumber, pathname, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full bg-brand-green/10 p-4">
        <span className="text-4xl">✓</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          ¡Mensaje enviado con éxito!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tu pedido #{orderNumber} fue registrado y enviado por WhatsApp al
          negocio.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="blue" fullWidth>
            Volver a enviar mensaje
          </Button>
        </a>
        <Link href={`/menu/${companyId}`}>
          <Button variant="green" fullWidth>
            Regresar al menú
          </Button>
        </Link>
      </div>
    </div>
  );
}
