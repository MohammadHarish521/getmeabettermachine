import { SPOTS, SPOT_HOLD_MS, type SpotSurface } from "@/config/spots";
import { FOUNDER_SPONSOR } from "@/config/site";
import { getDb, nowIso } from "@/lib/db";
import { letterLogo, displayNameFor } from "@/lib/format";
import { HttpError } from "@/lib/http";
import type { PublicSpot, PublicSponsor, SponsorRow } from "@/lib/types";

export type SpotRow = {
  id: string;
  sort_order: number;
  number: number;
  name: string;
  description: string;
  base_price: number;
  size: "S" | "M" | "L";
  surface: SpotSurface;
  x: number;
  y: number;
  occupant_sponsor_id: string | null;
  current_amount: number;
  pending_payment_id: string | null;
  pending_at: string | null;
  click_count: number;
};

export async function getSpot(id: string) {
  const db = await getDb();
  return db.prepare("SELECT * FROM spots WHERE id = ?").get<SpotRow>(id);
}

export async function listSpotRows() {
  const db = await getDb();
  return db
    .prepare("SELECT * FROM spots ORDER BY sort_order ASC, number ASC")
    .all<SpotRow>();
}

export function isSpotHeld(spot: SpotRow, now = Date.now()) {
  if (!spot.pending_payment_id || !spot.pending_at) return false;
  const held = new Date(spot.pending_at).getTime();
  return Number.isFinite(held) && now - held < SPOT_HOLD_MS;
}

export function nextSpotPrice(spot: SpotRow) {
  if (spot.occupant_sponsor_id && spot.current_amount > 0) {
    return Math.round(spot.current_amount * 1.5);
  }
  return spot.base_price;
}

export async function listPublicSpots(): Promise<PublicSpot[]> {
  const rows = await listSpotRows();
  const occupantIds = rows
    .map((row) => row.occupant_sponsor_id)
    .filter((id): id is string => Boolean(id));
  const db = await getDb();
  const sponsors = occupantIds.length
    ? await db
        .prepare(
          `SELECT * FROM sponsors WHERE id IN (${occupantIds.map(() => "?").join(",")})`,
        )
        .all<SponsorRow>(...occupantIds)
    : [];
  const byId = new Map(sponsors.map((row) => [row.id, row]));

  const layout = new Map(SPOTS.map((spot) => [spot.id, spot]));

  return rows.map((row) => {
    const occupantRow = row.occupant_sponsor_id
      ? byId.get(row.occupant_sponsor_id)
      : undefined;
    const config = layout.get(row.id);
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      description: row.description,
      size: row.size,
      surface: row.surface,
      gridCol: config?.gridCol ?? 1,
      gridRow: config?.gridRow ?? 1,
      gridSpan: config?.gridSpan ?? 1,
      gridRowSpan: config?.gridRowSpan ?? 1,
      x: row.x,
      y: row.y,
      basePrice: row.base_price,
      currentAmount: row.current_amount,
      nextPrice: nextSpotPrice(row),
      held: isSpotHeld(row),
      clicks: row.click_count ?? 0,
      occupant: occupantRow ? toSpotOccupant(occupantRow, row.name) : null,
    };
  });
}

function toSpotOccupant(row: SponsorRow, spotName: string): PublicSponsor {
  const anonymous = Boolean(row.is_anonymous);
  const displayName = displayNameFor(row);
  return {
    id: row.id,
    displayName,
    company: anonymous ? "" : row.company,
    website: anonymous || !row.website ? null : row.website,
    logoUrl: anonymous
      ? letterLogo("Anonymous")
      : row.logo_url || letterLogo(displayName),
    message: anonymous ? "" : row.message,
    amount: row.amount,
    createdAt: row.created_at,
    isAnonymous: anonymous,
    spotId: row.spot_id,
    spotName,
    isFounder: row.id === FOUNDER_SPONSOR.id,
  };
}

export async function holdSpot(spotId: string, paymentId: string, amount: number) {
  const spot = await getSpot(spotId);
  if (!spot) throw new HttpError(404, "That spot does not exist.");
  if (isSpotHeld(spot)) {
    throw new HttpError(409, "Someone else is checking out that spot. Try another.");
  }
  const price = nextSpotPrice(spot);
  if (amount < price) {
    throw new HttpError(400, `That spot is ${price === spot.base_price ? "" : "now "}$${price}.`);
  }
  const db = await getDb();
  await db
    .prepare(
      "UPDATE spots SET pending_payment_id = ?, pending_at = ? WHERE id = ?",
    )
    .run(paymentId, nowIso(), spotId);
  return spot;
}

export const SPOT_BUSY_MESSAGE =
  "Someone is checking out a spot right now. Try again in a few minutes.";

/** Hold every listed spot for one payment and remember what each one costs. */
export async function holdSpots(
  paymentId: string,
  parts: { id: string; price: number }[],
) {
  const db = await getDb();
  const ids = parts.map((part) => part.id);
  const cutoff = new Date(Date.now() - SPOT_HOLD_MS).toISOString();
  const held = await db
    .prepare(
      `UPDATE spots SET pending_payment_id = ?, pending_at = ?
       WHERE id IN (${ids.map(() => "?").join(",")})
         AND (pending_payment_id IS NULL OR pending_at IS NULL OR pending_at < ?)`,
    )
    .run(paymentId, nowIso(), ...ids, cutoff);
  if (held.changes !== ids.length) throw new HttpError(409, SPOT_BUSY_MESSAGE);

  await db
    .prepare(
      `INSERT INTO payment_spots (payment_id, spot_id, amount)
       VALUES ${parts.map(() => "(?, ?, ?)").join(", ")}`,
    )
    .run(...parts.flatMap((part) => [paymentId, part.id, part.price]));
}

/** Give the sponsor every spot held by this payment, at the price recorded for each. */
export async function occupyHeldSpots(paymentId: string, sponsorId: string) {
  const db = await getDb();
  const paid = "(SELECT amount FROM payment_spots WHERE payment_id = ? AND spot_id = spots.id)";
  await db
    .prepare(
      `UPDATE spots
       SET occupant_sponsor_id = ?, current_amount = ${paid},
           pending_payment_id = NULL, pending_at = NULL,
           click_count = 0
       WHERE id IN (SELECT spot_id FROM payment_spots WHERE payment_id = ?)
         AND (occupant_sponsor_id IS NULL OR current_amount <= ${paid})`,
    )
    .run(sponsorId, paymentId, paymentId, paymentId);
  await clearSpotPending(paymentId);
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM payment_spots WHERE payment_id = ?")
    .get<{ count: number }>(paymentId);
  return Number(row?.count) || 0;
}

export async function occupySpot(spotId: string, sponsorId: string, amount: number) {
  const spot = await getSpot(spotId);
  if (!spot) return;
  const current = spot.current_amount || 0;
  if (spot.occupant_sponsor_id && amount < current) return;
  const db = await getDb();
  await db
    .prepare(
      `UPDATE spots
       SET occupant_sponsor_id = ?, current_amount = ?,
           pending_payment_id = NULL, pending_at = NULL,
           click_count = 0
       WHERE id = ?`,
    )
    .run(sponsorId, amount, spotId);
}

export async function clearSpotPending(paymentId: string) {
  const db = await getDb();
  await db
    .prepare(
      `UPDATE spots
       SET pending_payment_id = NULL, pending_at = NULL
       WHERE pending_payment_id = ?`,
    )
    .run(paymentId);
}

export async function clearSpotOccupant(sponsorId: string) {
  const db = await getDb();
  await db
    .prepare(
      `UPDATE spots
       SET occupant_sponsor_id = NULL, current_amount = 0
       WHERE occupant_sponsor_id = ?`,
    )
    .run(sponsorId);
}

export async function incrementSpotClicks(id: string) {
  const spot = await getSpot(id);
  if (!spot) throw new HttpError(404, "That spot does not exist.");
  const db = await getDb();
  await db
    .prepare("UPDATE spots SET click_count = click_count + 1 WHERE id = ?")
    .run(id);
  const updated = await getSpot(id);
  return updated?.click_count ?? spot.click_count + 1;
}

export async function updateSpotPrice(id: string, basePrice: number) {
  const db = await getDb();
  await db.prepare("UPDATE spots SET base_price = ? WHERE id = ?").run(basePrice, id);
}

export function spotBySurface(spots: PublicSpot[], surface: PublicSpot["surface"]) {
  return spots.find((spot) => spot.surface === surface && spot.occupant) ?? null;
}
