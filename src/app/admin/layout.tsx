import { CompanyProvider } from "@/presentation/providers/CompanyProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
