import { cache } from "react";
import { getDb, nowIso } from "@/lib/db";
import { letterLogo, displayNameFor } from "@/lib/format";
import { resolveFunding } from "@/lib/funding";
import { getSiteSettings } from "@/lib/settings";
import { isDodoConfigured } from "@/lib/dodo";
import { listMachineTiers } from "@/lib/tiers";
import { listPublicSpots, listSpotRows } from "@/lib/spots";
import { FOUNDER_SPONSOR } from "@/config/site";
import { ALL_SPOTS_ID } from "@/config/spots";
import type {
  ActivityItem,
  ActivityRow,
  PublicSponsor,
  SponsorRow,
} from "@/lib/types";

export const getHomeSnapshot = cache(async () => {
  const [tiers, raised, sponsors, spots, activity, settings, fromClients] = await Promise.all([
    listMachineTiers(),
    paidRaised(),
    listVisibleSponsors(),
    listPublicSpots(),
    listActivity(12),
    getSiteSettings(),
    clientRaised(),
  ]);
  const funding = resolveFunding(raised, tiers);
  const stats = sponsorStats(sponsors, raised);

  return {
    funding,
    sponsors,
    spots,
    stats,
    activity,
    settings,
    fromClients,
    mockPayments: !isDodoConfigured(),
  };
});

export async function paidRaised() {
  const db = await getDb();
  const row = await db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM sponsors WHERE status = 'paid'",
    )
    .get<{ total: number }>();
  return Number(row?.total) || 0;
}

async function clientRaised() {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM sponsors
       WHERE status = 'paid' AND id LIKE 'client-%'`,
    )
    .get<{ total: number }>();
  return Number(row?.total) || 0;
}

export async function listVisibleSponsors(): Promise<PublicSponsor[]> {
  const names = new Map((await listSpotRows()).map((spot) => [spot.id, spot.name]));
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT * FROM sponsors
       WHERE status = 'paid' AND is_visible = 1
       ORDER BY created_at DESC`,
    )
    .all<SponsorRow>();

  return rows.map((row) => ({
    ...toPublicSponsor(row),
    spotName:
      row.spot_id === ALL_SPOTS_ID
        ? "All spots"
        : row.spot_id
          ? names.get(row.spot_id) ?? null
          : null,
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

export async function listActivity(limit = 12): Promise<ActivityItem[]> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT id, type, label, created_at
       FROM activity_events
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all<ActivityRow>(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type === "unlock" ? "unlock" : "sponsor",
    label: row.label,
    createdAt: row.created_at,
  }));
}

export async function listAllSponsors() {
  const db = await getDb();
  return db
    .prepare(`SELECT * FROM sponsors ORDER BY created_at DESC`)
    .all<SponsorRow>();
}

export async function listAllPayments() {
  const db = await getDb();
  return db.prepare(`SELECT * FROM payments ORDER BY created_at DESC`).all();
}

export async function listRecentWebhooks(limit = 20) {
  const db = await getDb();
  return db
    .prepare(
      `SELECT event_id, processed_at FROM processed_webhooks
       ORDER BY processed_at DESC LIMIT ?`,
    )
    .all<{ event_id: string; processed_at: string }>(limit);
}

export async function adminOverview() {
  const db = await getDb();
  const raised = await paidRaised();
  const payments = await db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END), 0) AS succeeded,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
       FROM payments`,
    )
    .get<{
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
  }>();
  const webhooks = await db
    .prepare("SELECT COUNT(*) AS count FROM processed_webhooks")
    .get<{ count: number }>();

  return {
    raised,
    sponsorCount: (await listVisibleSponsors()).length,
    payments: payments ?? { total: 0, succeeded: 0, pending: 0, failed: 0 },
    webhookCount: webhooks?.count ?? 0,
    recentWebhooks: await listRecentWebhooks(),
    sponsors: await listAllSponsors(),
    spots: await listPublicSpots(),
    tiers: await listMachineTiers(),
    settings: await getSiteSettings(),
    mockPayments: !isDodoConfigured(),
  };
}

export async function updateSponsor(
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
  const db = await getDb();
  const current = await db
    .prepare("SELECT * FROM sponsors WHERE id = ?")
    .get<SponsorRow>(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await db
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
  return db.prepare("SELECT * FROM sponsors WHERE id = ?").get<SponsorRow>(id);
}
