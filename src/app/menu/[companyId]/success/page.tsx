import { SuccessPageClient } from "@/presentation/components/menu/SuccessPageClient";
import { useEffect } from "react";

interface PageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ order?: string; wa?: string; origin?: string }>;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  
  const { companyId } = await params;
  const { order, wa, origin } = await searchParams;

  return (
    <SuccessPageClient
      companyId={companyId}
      orderNumber={order ?? "000000"}
      whatsAppUrl={wa ? decodeURIComponent(wa) : "#"}
      origin={origin ?? ''}
    />
  );
}
