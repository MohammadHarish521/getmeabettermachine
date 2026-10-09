import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-session";
import { isAdminConfigured } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24">
        <h1 className="text-[28px] font-medium tracking-[-0.04em]">Admin is closed</h1>
        <p className="mt-3 text-[15px] text-mute">
          Set ADMIN_PASSWORD before using this page.
        </p>
      </div>
    );
  }
  if (await getAdminSession()) redirect("/admin");

  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
