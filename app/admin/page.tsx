import { redirect } from "next/navigation";
import { isAuthenticated, getSession } from "@/lib/auth";
import { getWeddingData } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/login");
  }

  const session = await getSession();
  const weddingData = await getWeddingData();

  return (
    <AdminDashboard
      initialData={weddingData}
      adminUsername={session?.username || "Administrator"}
    />
  );
}
