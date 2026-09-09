import { AdminSidebar } from "@/presentation/components/admin/AdminSidebar";
import { NewOrderNotifier } from "@/presentation/components/admin/NewOrderNotifier";
import { NoCompanyLinkedBanner } from "@/presentation/components/admin/NoCompanyLinkedBanner";
import { LicenseAccessGate } from "@/presentation/components/admin/LicenseAccessGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-4 pt-16 sm:p-6 md:pt-6">
        <NoCompanyLinkedBanner />
        <LicenseAccessGate>{children}</LicenseAccessGate>
      </main>
      <NewOrderNotifier />
    </div>
  );
}
