import { jsonError, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/admin-auth";
import { getSponsorById } from "@/lib/payments";
import { updateSponsor } from "@/lib/queries";
import { normalizeOptionalHttpUrl, normalizeXUrl } from "@/lib/urls";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const existing = getSponsorById(id);
    if (!existing) throw new HttpError(404, "Sponsor not found.");
    const body = (await request.json()) as Record<string, unknown>;

    const patch: Parameters<typeof updateSponsor>[1] = {};
    if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 80);
    if (typeof body.company === "string") {
      patch.company = body.company.trim().slice(0, 80);
    }
    if (typeof body.website === "string") {
      patch.website = normalizeOptionalHttpUrl(body.website, "Website");
    }
    if (typeof body.xUrl === "string" || typeof body.x_url === "string") {
      patch.x_url = normalizeXUrl(
        typeof body.xUrl === "string" ? body.xUrl : (body.x_url as string),
      );
    }
    if (typeof body.logoUrl === "string" || typeof body.logo_url === "string") {
      const raw =
        typeof body.logoUrl === "string" ? body.logoUrl : (body.logo_url as string);
      patch.logo_url = normalizeOptionalHttpUrl(raw, "Logo URL");
    }
    if (typeof body.message === "string") {
      patch.message = body.message.trim().slice(0, 280);
    }
    if (typeof body.isVisible === "boolean") {
      patch.is_visible = body.isVisible ? 1 : 0;
    } else if (typeof body.is_visible === "number") {
      patch.is_visible = body.is_visible;
    }
    if (typeof body.isAnonymous === "boolean") {
      patch.is_anonymous = body.isAnonymous ? 1 : 0;
    }
    if (typeof body.status === "string") patch.status = body.status;

    const updated = updateSponsor(id, patch);
    return Response.json({ sponsor: updated });
  } catch (error) {
    return jsonError(error);
  }
}
