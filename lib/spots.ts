import { SPOTS, SPOT_HOLD_MS } from "@/config/spots";
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
  surface: "stage" | "nav" | "footer";
  x: number;
  y: number;
  occupant_sponsor_id: string | null;
  current_amount: number;
  pending_payment_id: string | null;
  pending_at: string | null;
};

export function getSpot(id: string) {
  return getDb()
    .prepare("SELECT * FROM spots WHERE id = ?")
    .get(id) as SpotRow | undefined;
}

export function listSpotRows() {
  return getDb()
    .prepare("SELECT * FROM spots ORDER BY sort_order ASC, number ASC")
    .all() as SpotRow[];
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

export function listPublicSpots(): PublicSpot[] {
  const rows = listSpotRows();
  const occupantIds = rows
    .map((row) => row.occupant_sponsor_id)
    .filter((id): id is string => Boolean(id));
  const sponsors = occupantIds.length
    ? (getDb()
        .prepare(
          `SELECT * FROM sponsors WHERE id IN (${occupantIds.map(() => "?").join(",")})`,
        )
        .all(...occupantIds) as SponsorRow[])
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
      x: row.x,
      y: row.y,
      basePrice: row.base_price,
      currentAmount: row.current_amount,
      nextPrice: nextSpotPrice(row),
      held: isSpotHeld(row),
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

export function holdSpot(spotId: string, paymentId: string, amount: number) {
  const spot = getSpot(spotId);
  if (!spot) throw new HttpError(404, "That spot does not exist.");
  if (isSpotHeld(spot)) {
    throw new HttpError(409, "Someone else is checking out that spot. Try another.");
  }
  const price = nextSpotPrice(spot);
  if (amount < price) {
    throw new HttpError(400, `That spot is ${price === spot.base_price ? "" : "now "}$${price}.`);
  }
  getDb()
    .prepare(
      "UPDATE spots SET pending_payment_id = ?, pending_at = ? WHERE id = ?",
    )
    .run(paymentId, nowIso(), spotId);
  return spot;
}

export function occupySpot(spotId: string, sponsorId: string, amount: number) {
  const spot = getSpot(spotId);
  if (!spot) return;
  const current = spot.current_amount || 0;
  if (spot.occupant_sponsor_id && amount < current) return;
  getDb()
    .prepare(
      `UPDATE spots
       SET occupant_sponsor_id = ?, current_amount = ?,
           pending_payment_id = NULL, pending_at = NULL
       WHERE id = ?`,
    )
    .run(sponsorId, amount, spotId);
}

export function clearSpotPending(paymentId: string) {
  getDb()
    .prepare(
      `UPDATE spots
       SET pending_payment_id = NULL, pending_at = NULL
       WHERE pending_payment_id = ?`,
    )
    .run(paymentId);
}

export function clearSpotOccupant(sponsorId: string) {
  getDb()
    .prepare(
      `UPDATE spots
       SET occupant_sponsor_id = NULL, current_amount = 0
       WHERE occupant_sponsor_id = ?`,
    )
    .run(sponsorId);
}

export function updateSpotPrice(id: string, basePrice: number) {
  getDb().prepare("UPDATE spots SET base_price = ? WHERE id = ?").run(basePrice, id);
}

export function spotBySurface(spots: PublicSpot[], surface: PublicSpot["surface"]) {
  return spots.find((spot) => spot.surface === surface && spot.occupant) ?? null;
}
