import { cache } from "react";
import { getDb, nowIso } from "@/lib/db";
import { letterLogo, displayNameFor } from "@/lib/format";
import { resolveFunding } from "@/lib/funding";
import { getSiteSettings } from "@/lib/settings";
import { isDodoConfigured } from "@/lib/dodo";
import { listMachineTiers } from "@/lib/tiers";
import { listPublicSpots, listSpotRows } from "@/lib/spots";
import { FOUNDER_SPONSOR } from "@/config/site";
import type {
  ActivityItem,
  ActivityRow,
  PublicSponsor,
  SponsorRow,
} from "@/lib/types";

export const getHomeSnapshot = cache(async () => {
  const tiers = listMachineTiers();
  const raised = paidRaised();
  const funding = resolveFunding(raised, tiers);
  const sponsors = listVisibleSponsors();
  const spots = listPublicSpots();
  const stats = sponsorStats(sponsors, raised);
  const activity = listActivity(12);
  const settings = getSiteSettings();

  return {
    funding,
    sponsors,
    spots,
    stats,
    activity,
    settings,
    mockPayments: !isDodoConfigured(),
  };
});

export function paidRaised() {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM sponsors WHERE status = 'paid'",
    )
    .get() as { total: number };
  return Number(row.total) || 0;
}

export function listVisibleSponsors(): PublicSponsor[] {
  const names = new Map(listSpotRows().map((spot) => [spot.id, spot.name]));
  const rows = getDb()
    .prepare(
      `SELECT * FROM sponsors
       WHERE status = 'paid' AND is_visible = 1
       ORDER BY created_at DESC`,
    )
    .all() as SponsorRow[];

  return rows.map((row) => ({
    ...toPublicSponsor(row),
    spotName: row.spot_id ? names.get(row.spot_id) ?? null : null,
  }));
}

export function toPublicSponsor(row: SponsorRow): PublicSponsor {
  const anonymous = Boolean(row.is_anonymous);
  const displayName = displayNameFor(row);
  return {
    id: row.id,
    displayName,
    company: anonymous ? "" : row.company,
    website: anonymous || !row.website ? null : row.website,
    logoUrl: anonymous ? letterLogo("Anonymous") : row.logo_url || letterLogo(displayName),
    message: anonymous ? "" : row.message,
    amount: row.amount,
    createdAt: row.created_at,
    isAnonymous: anonymous,
    spotId: row.spot_id,
    spotName: null,
    isFounder: row.id === FOUNDER_SPONSOR.id,
  };
}

export function sponsorStats(sponsors: PublicSponsor[], raised: number) {
  const largest = sponsors.reduce<PublicSponsor | null>((best, sponsor) => {
    if (!best || sponsor.amount > best.amount) return sponsor;
    return best;
  }, null);
  const latest = sponsors[0] ?? null;
  return {
    raised,
    count: sponsors.length,
    largestAmount: largest?.amount ?? 0,
    largestName: largest?.displayName ?? null,
    latestName: latest?.displayName ?? null,
  };
}

export function listActivity(limit = 12): ActivityItem[] {
  const rows = getDb()
    .prepare(
      `SELECT id, type, label, created_at
       FROM activity_events
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(limit) as ActivityRow[];

  return rows.map((row) => ({
    id: row.id,
    type: row.type === "unlock" ? "unlock" : "sponsor",
    label: row.label,
    createdAt: row.created_at,
  }));
}

export function listAllSponsors() {
  return getDb()
    .prepare(`SELECT * FROM sponsors ORDER BY created_at DESC`)
    .all() as SponsorRow[];
}

export function listAllPayments() {
  return getDb()
    .prepare(`SELECT * FROM payments ORDER BY created_at DESC`)
    .all();
}

export function listRecentWebhooks(limit = 20) {
  return getDb()
    .prepare(
      `SELECT event_id, processed_at FROM processed_webhooks
       ORDER BY processed_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{ event_id: string; processed_at: string }>;
}

export function adminOverview() {
  const db = getDb();
  const raised = paidRaised();
  const payments = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END), 0) AS succeeded,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
       FROM payments`,
    )
    .get() as {
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
  };
  const webhooks = db
    .prepare("SELECT COUNT(*) AS count FROM processed_webhooks")
    .get() as { count: number };

  return {
    raised,
    sponsorCount: listVisibleSponsors().length,
    payments,
    webhookCount: webhooks.count,
    recentWebhooks: listRecentWebhooks(),
    sponsors: listAllSponsors(),
    spots: listPublicSpots(),
    tiers: listMachineTiers(),
    settings: getSiteSettings(),
    mockPayments: !isDodoConfigured(),
  };
}

export function updateSponsor(
  id: string,
  patch: Partial<{
    name: string;
    company: string;
    website: string;
    x_url: string;
    logo_url: string;
    message: string;
    is_visible: number;
    is_anonymous: number;
    status: string;
  }>,
) {
  const current = getDb()
    .prepare("SELECT * FROM sponsors WHERE id = ?")
    .get(id) as SponsorRow | undefined;
  if (!current) return null;
  const next = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE sponsors
       SET name = ?, company = ?, website = ?, x_url = ?, logo_url = ?, message = ?,
           is_visible = ?, is_anonymous = ?, status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.company,
      next.website,
      next.x_url,
      next.logo_url,
      next.message,
      next.is_visible,
      next.is_anonymous,
      next.status,
      nowIso(),
      id,
    );
  return getDb()
    .prepare("SELECT * FROM sponsors WHERE id = ?")
    .get(id) as SponsorRow;
}
