import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdminPage } from "@/lib/admin-session";
import { adminOverview } from "@/lib/queries";
import { isAdminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminConfigured();
  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24">
        <h1 className="text-[28px] font-medium tracking-[-0.04em]">Admin is closed</h1>
        <p className="mt-3 text-[15px] text-mute">
          Set <code className="text-ink">ADMIN_PASSWORD</code> in the environment to open this
          interface.
        </p>
      </div>
    );
  }

  await requireAdminPage();
  const data = adminOverview();
  return <AdminDashboard initial={data} />;
}
