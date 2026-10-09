import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminToken } from "@/lib/admin-auth";

export async function getAdminSession() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminPage() {
  if (!isAdminConfigured()) return false;
  const ok = await getAdminSession();
  if (!ok) redirect("/admin/login");
  return true;
}
