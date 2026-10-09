import { jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/admin-auth";
import { adminOverview } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await adminOverview());
  } catch (error) {
    return jsonError(error);
  }
}
