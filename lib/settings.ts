import { SITE_DEFAULTS, type SiteSettings } from "@/config/site";
import { getDb, nowIso } from "@/lib/db";

function mergeSettings(raw: unknown): SiteSettings {
  const parsed = raw && typeof raw === "object" ? (raw as Partial<SiteSettings>) : {};
  return {
    minSponsorAmount:
      typeof parsed.minSponsorAmount === "number"
        ? parsed.minSponsorAmount
        : SITE_DEFAULTS.minSponsorAmount,
    maxSponsorAmount:
      typeof parsed.maxSponsorAmount === "number"
        ? parsed.maxSponsorAmount
        : SITE_DEFAULTS.maxSponsorAmount,
    bidIncrement:
      typeof parsed.bidIncrement === "number"
        ? parsed.bidIncrement
        : SITE_DEFAULTS.bidIncrement,
    presetAmounts: Array.isArray(parsed.presetAmounts)
      ? parsed.presetAmounts.filter((n): n is number => typeof n === "number")
      : SITE_DEFAULTS.presetAmounts,
    currency:
      typeof parsed.currency === "string" ? parsed.currency : SITE_DEFAULTS.currency,
    creator: {
      name: parsed.creator?.name ?? SITE_DEFAULTS.creator.name,
      xUrl: parsed.creator?.xUrl ?? SITE_DEFAULTS.creator.xUrl,
      linkedInUrl: parsed.creator?.linkedInUrl ?? SITE_DEFAULTS.creator.linkedInUrl,
    },
    socialProof: {
      xFollowing: parsed.socialProof?.xFollowing ?? null,
      linkedInFollowing: parsed.socialProof?.linkedInFollowing ?? null,
      monthlyImpressions: parsed.socialProof?.monthlyImpressions ?? null,
      productsLaunched: parsed.socialProof?.productsLaunched ?? null,
      pastSponsorshipResults: parsed.socialProof?.pastSponsorshipResults ?? null,
    },
  };
}

export function getSiteSettings(): SiteSettings {
  const row = getDb()
    .prepare("SELECT value FROM site_settings WHERE key = 'site'")
    .get() as { value: string } | undefined;
  if (!row) return SITE_DEFAULTS;
  try {
    return mergeSettings(JSON.parse(row.value) as unknown);
  } catch {
    return SITE_DEFAULTS;
  }
}

export function saveSiteSettings(next: SiteSettings) {
  getDb()
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ('site', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(JSON.stringify(next), nowIso());
}
