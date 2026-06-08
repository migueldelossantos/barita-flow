import { AdminSidebar } from "@/presentation/components/admin/AdminSidebar";
import { NewOrderNotifier } from "@/presentation/components/admin/NewOrderNotifier";
import { NoCompanyLinkedBanner } from "@/presentation/components/admin/NoCompanyLinkedBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">
        <NoCompanyLinkedBanner />
        {children}
      </main>
      <NewOrderNotifier />
    </div>
  );
}
