import { jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/admin-auth";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings";
import { SITE_DEFAULTS, type SiteSettings } from "@/config/site";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ settings: getSiteSettings() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Partial<SiteSettings>;
    const current = getSiteSettings();
    const next: SiteSettings = {
      ...SITE_DEFAULTS,
      ...current,
      ...body,
      creator: { ...current.creator, ...body.creator },
      socialProof: { ...current.socialProof, ...body.socialProof },
      presetAmounts: Array.isArray(body.presetAmounts)
        ? body.presetAmounts.map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : current.presetAmounts,
    };
    saveSiteSettings(next);
    return Response.json({ settings: next });
  } catch (error) {
    return jsonError(error);
  }
}
