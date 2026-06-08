import { CartPageClient } from "@/presentation/components/menu/CartPageClient";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CartPage({ params }: PageProps) {
  const { companyId } = await params;
  return <CartPageClient companyId={companyId} />;
}
