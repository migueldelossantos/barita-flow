import { SuperAdminClient } from "@/presentation/components/admin/SuperAdminClient";
import { SuperAdminHeader } from "@/presentation/components/admin/SuperAdminHeader";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { redirect } from "next/navigation";

export default async function SuperAdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  const { data: admin } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/admin/dashboard");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <SuperAdminHeader />
      <SuperAdminClient />
    </main>
  );
}
