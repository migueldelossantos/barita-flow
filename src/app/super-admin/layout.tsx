import { CompanyProvider } from "@/presentation/providers/CompanyProvider";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
