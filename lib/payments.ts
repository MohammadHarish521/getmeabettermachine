import crypto from "node:crypto";
import { getAppUrl } from "@/lib/env";
import { getDb, nowIso } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { formatUsd, letterLogo, displayNameFor } from "@/lib/format";
import { resolveFunding } from "@/lib/funding";
import { getSiteSettings } from "@/lib/settings";
import { listMachineTiers } from "@/lib/tiers";
import {
  createDodoCheckout,
  dodoErrorCode,
  getDodoClient,
  isDodoConfigured,
} from "@/lib/dodo";
import {
  hostnameFromUrl,
  normalizeOptionalHttpUrl,
  normalizeSponsorUrl,
  normalizeXUrl,
} from "@/lib/urls";
import { cachedListingMeta, fetchListingMeta } from "@/lib/listing-meta";
import { reportDodoPaymentToDataFast } from "@/lib/datafast-revenue";
import { ALL_SPOTS_ID, isMachineSpot } from "@/config/spots";
import {
  SPOT_BUSY_MESSAGE,
  clearSpotOccupant,
  clearSpotPending,
  getSpot,
  holdSpot,
  holdSpots,
  isSpotHeld,
  listSpotRows,
  nextSpotPrice,
  occupyHeldSpots,
  occupySpot,
} from "@/lib/spots";
import type { PaymentRow, SponsorRow } from "@/lib/types";

export type CheckoutInput = {
  spotId: unknown;
  amount?: unknown;
  name?: string;
  company?: string;
  website?: string;
  xUrl?: string;
  logoUrl?: string;
  message?: string;
  isAnonymous?: boolean;
};

async function getPayment(id: string) {
  const db = await getDb();
  return db.prepare("SELECT * FROM payments WHERE id = ?").get<PaymentRow>(id);
}

async function getSponsor(id: string) {
  const db = await getDb();
  return db.prepare("SELECT * FROM sponsors WHERE id = ?").get<SponsorRow>(id);
}

async function parseAmount(raw: unknown, floor: number, priceLabel = "That spot is") {
  const settings = await getSiteSettings();
  const value =
    raw === undefined || raw === null || raw === ""
      ? floor
      : typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw.trim())
          : NaN;
  if (!Number.isInteger(value)) {
    throw new HttpError(400, "Amount must be a whole dollar amount.");
  }
  if (value < floor) {
    throw new HttpError(400, `${priceLabel} $${floor}.`);
  }
  if (value > settings.maxSponsorAmount) {
    throw new HttpError(
      400,
      `Maximum sponsorship is $${settings.maxSponsorAmount}.`,
    );
  }
  return value;
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

type SpotOrder = {
  label: string;
  priceLabel: string;
  price: number;
  parts: { id: string; price: number }[] | null;
};

async function spotOrder(spotId: string): Promise<SpotOrder> {
  if (spotId === ALL_SPOTS_ID) {
    const rows = (await listSpotRows()).filter((row) => isMachineSpot(row));
    if (rows.length === 0) throw new HttpError(404, "There are no spots to take.");
    if (rows.some((row) => isSpotHeld(row))) throw new HttpError(409, SPOT_BUSY_MESSAGE);
    const parts = rows.map((row) => ({ id: row.id, price: nextSpotPrice(row) }));
    return {
      label: "All Mac spots",
      priceLabel: "The Mac spots are",
      price: parts.reduce((sum, part) => sum + part.price, 0),
      parts,
    };
  }

  const spot = await getSpot(spotId);
  if (!spot) throw new HttpError(404, "That spot does not exist.");
  return {
    label: spot.name,
    priceLabel: "That spot is",
    price: nextSpotPrice(spot),
    parts: null,
  };
}

export async function createSponsorshipCheckout(
  input: CheckoutInput & { datafastVisitorId?: string | null },
) {
  const spotId = typeof input.spotId === "string" ? input.spotId.trim() : "";
  if (!spotId) throw new HttpError(400, "Pick a spot on the machine first.");
  const order = await spotOrder(spotId);

  const amount = await parseAmount(input.amount, order.price, order.priceLabel);
  const website = normalizeSponsorUrl(String(input.website ?? ""));
  const meta = cachedListingMeta(website) ?? {
    title: null,
    description: null,
    image: null,
  };
  const host = hostnameFromUrl(website);
  const name = clip(meta.title || host, 80) || "Sponsor";
  const company = clip(host, 80);
  const message = clip(meta.description ?? "", 280);
  const xUrl = normalizeXUrl(input.xUrl);
  const logoUrl = normalizeOptionalHttpUrl(input.logoUrl, "Logo URL");
  const isAnonymous = Boolean(input.isAnonymous);

  const sponsorId = crypto.randomUUID();
  const paymentId = crypto.randomUUID();
  const createdAt = nowIso();
  const provider = isDodoConfigured() ? "dodo" : "mock";
  const shownName = isAnonymous ? "Anonymous" : name;
  const storedLogo = logoUrl || letterLogo(shownName);

  const db = await getDb();
  await db.transaction(async () => {
    if (order.parts) await holdSpots(paymentId, order.parts);
    else await holdSpot(spotId, paymentId, amount);
    const database = await getDb();
    await database
      .prepare(
        `INSERT INTO sponsors (
           id, name, company, website, x_url, logo_url, message, amount, currency,
           status, payment_id, checkout_id, is_anonymous, is_visible, spot_id,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', 'pending', ?, NULL, ?, 0, ?, ?, ?)`,
      )
      .run(
        sponsorId,
        name,
        company,
        website,
        xUrl,
        storedLogo,
        message,
        amount,
        paymentId,
        isAnonymous ? 1 : 0,
        spotId,
        createdAt,
        createdAt,
      );

    await database
      .prepare(
        `INSERT INTO payments (
           id, sponsor_id, amount, status, provider, created_at
         ) VALUES (?, ?, ?, 'pending', ?, ?)`,
      )
      .run(paymentId, sponsorId, amount, provider, createdAt);
  });

  return finalizeCheckout({
    paymentId,
    sponsorId,
    amount,
    sponsorName: `${shownName} · ${order.label}`,
    provider,
    datafastVisitorId: input.datafastVisitorId,
  });
}

export async function enrichSponsorListing(sponsorId: string) {
  const sponsor = await getSponsor(sponsorId);
  if (!sponsor?.website || sponsor.is_anonymous) return;

  const meta = await fetchListingMeta(sponsor.website);
  const host = hostnameFromUrl(sponsor.website);
  const name = clip(meta.title || sponsor.name || host, 80) || "Sponsor";
  const message = clip(meta.description ?? sponsor.message ?? "", 280);
  if (name === sponsor.name && message === sponsor.message) {
    return;
  }

  const db = await getDb();
  await db
    .prepare(
      `UPDATE sponsors
       SET name = ?, company = ?, message = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(name, clip(host, 80), message, nowIso(), sponsor.id);
}

async function finalizeCheckout(input: {
  paymentId: string;
  sponsorId: string;
  amount: number;
  sponsorName: string;
  provider: "dodo" | "mock";
  datafastVisitorId?: string | null;
}) {
  if (input.provider === "dodo") {
    try {
      const checkout = await createDodoCheckout({
        paymentId: input.paymentId,
        sponsorId: input.sponsorId,
        amountDollars: input.amount,
        sponsorName: input.sponsorName,
        datafastVisitorId: input.datafastVisitorId,
      });

      const db = await getDb();
      await db
        .prepare(
          "UPDATE payments SET dodo_session_id = ?, checkout_url = ? WHERE id = ?",
        )
        .run(checkout.id, checkout.url, input.paymentId);
      await db
        .prepare(
          "UPDATE sponsors SET checkout_id = ?, updated_at = ? WHERE id = ?",
        )
        .run(checkout.id, nowIso(), input.sponsorId);

      return {
        paymentId: input.paymentId,
        sponsorId: input.sponsorId,
        checkoutUrl: checkout.url,
        mock: false,
      };
    } catch (error) {
      await markCheckoutFailed(input.paymentId, input.sponsorId);
      console.error("Dodo checkout failed", error);
      if (dodoErrorCode(error) === "REQUEST_AMOUNT_BELOW_MINIMUM") {
        throw new HttpError(
          502,
          "That amount is below the Dodo product minimum. In the Dodo dashboard, set the Pay What You Want floor to $1.",
        );
      }
      throw new HttpError(502, "Could not start checkout. Try again.");
    }
  }

  const checkoutUrl = `${getAppUrl()}/sponsor/mock/${input.paymentId}`;
  const db = await getDb();
  await db
    .prepare("UPDATE payments SET checkout_url = ? WHERE id = ?")
    .run(checkoutUrl, input.paymentId);

  return {
    paymentId: input.paymentId,
    sponsorId: input.sponsorId,
    checkoutUrl,
    mock: true,
  };
}

async function markCheckoutFailed(paymentId: string, sponsorId: string) {
  const db = await getDb();
  await db.transaction(async () => {
    const database = await getDb();
    await database.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(paymentId);
    await database
      .prepare("UPDATE sponsors SET status = 'failed', updated_at = ? WHERE id = ?")
      .run(nowIso(), sponsorId);
    await clearSpotPending(paymentId);
  });
}

async function insertActivity(input: {
  type: "sponsor" | "unlock";
  sponsorId?: string | null;
  tierId?: string | null;
  amount?: number | null;
  label: string;
}) {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO activity_events (id, type, sponsor_id, tier_id, amount, label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      crypto.randomUUID(),
      input.type,
      input.sponsorId ?? null,
      input.tierId ?? null,
      input.amount ?? null,
      input.label,
      nowIso(),
    );
}

async function paidRaised() {
  const db = await getDb();
  const row = await db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM sponsors WHERE status = 'paid'")
    .get<{ total: number }>();
  return Number(row?.total) || 0;
}

async function recordUnlocks(previousRaised: number, nextRaised: number) {
  const tiers = await listMachineTiers();
  const before = resolveFunding(previousRaised, tiers);
  const after = resolveFunding(nextRaised, tiers);
  const newly = after.unlocked.filter(
    (tier) => !before.unlocked.some((item) => item.id === tier.id),
  );
  for (const tier of newly) {
    await insertActivity({
      type: "unlock",
      tierId: tier.id,
      label: `${tier.chip} ${memoryLabel(tier.memory)} configuration unlocked`,
    });
  }
}

function memoryLabel(memory: string) {
  return memory.replace(/unified memory/i, "").trim();
}

export async function confirmPayment(
  paymentId: string,
  extras: { dodoPaymentId?: string | null; dodoSessionId?: string | null } = {},
) {
  const db = await getDb();
  return db.transaction(async () => {
    const payment = await getPayment(paymentId);
    if (!payment) throw new HttpError(404, "Payment not found.");

    if (payment.status === "succeeded") {
      const sponsor = await getSponsor(payment.sponsor_id);
      if (!sponsor) throw new HttpError(404, "Sponsor not found.");
      return { alreadyProcessed: true, payment, sponsor };
    }

    if (payment.status === "failed") {
      throw new HttpError(409, "This payment can no longer be confirmed.");
    }

    const sponsor = await getSponsor(payment.sponsor_id);
    if (!sponsor) throw new HttpError(404, "Sponsor not found.");

    const processedAt = nowIso();
    const previousRaised = await paidRaised();
    const database = await getDb();

    await database
      .prepare(
        `UPDATE payments
         SET status = 'succeeded',
             processed_at = ?,
             dodo_payment_id = COALESCE(?, dodo_payment_id),
             dodo_session_id = COALESCE(?, dodo_session_id)
         WHERE id = ?`,
      )
      .run(
        processedAt,
        extras.dodoPaymentId ?? null,
        extras.dodoSessionId ?? null,
        payment.id,
      );

    await database
      .prepare(
        `UPDATE sponsors
         SET status = 'paid', is_visible = 1, updated_at = ?
         WHERE id = ?`,
      )
      .run(processedAt, sponsor.id);

    const updatedSponsor = (await getSponsor(sponsor.id))!;
    const updatedPayment = (await getPayment(payment.id))!;
    const name = displayNameFor(updatedSponsor);
    const takesAll = updatedSponsor.spot_id === ALL_SPOTS_ID;
    const spot =
      updatedSponsor.spot_id && !takesAll ? await getSpot(updatedSponsor.spot_id) : null;
    let spotCount = 0;
    if (takesAll) {
      spotCount = await occupyHeldSpots(payment.id, sponsor.id);
    } else if (updatedSponsor.spot_id) {
      await occupySpot(updatedSponsor.spot_id, sponsor.id, sponsor.amount);
    }

    await insertActivity({
      type: "sponsor",
      sponsorId: sponsor.id,
      amount: sponsor.amount,
      label: takesAll
        ? `${name} took all ${spotCount} spots for ${formatUsd(sponsor.amount)}`
        : spot
          ? `${name} took ${spot.name} for ${formatUsd(sponsor.amount)}`
          : `${name} sponsored ${formatUsd(sponsor.amount)}`,
    });

    await recordUnlocks(previousRaised, previousRaised + sponsor.amount);

    return {
      alreadyProcessed: false,
      payment: updatedPayment,
      sponsor: updatedSponsor,
    };
  });
}

export async function failPayment(paymentId: string) {
  const db = await getDb();
  await db.transaction(async () => {
    const payment = await getPayment(paymentId);
    if (!payment || payment.status !== "pending") return;
    const processedAt = nowIso();
    const database = await getDb();
    await database
      .prepare("UPDATE payments SET status = 'failed', processed_at = ? WHERE id = ?")
      .run(processedAt, payment.id);
    await database
      .prepare("UPDATE sponsors SET status = 'failed', updated_at = ? WHERE id = ?")
      .run(processedAt, payment.sponsor_id);
    await clearSpotPending(payment.id);
  });
}

export async function refundPayment(paymentId: string) {
  const db = await getDb();
  await db.transaction(async () => {
    const payment = await getPayment(paymentId);
    if (!payment) return;
    if (payment.status !== "succeeded" && payment.status !== "pending") return;
    const processedAt = nowIso();
    const database = await getDb();
    await database
      .prepare("UPDATE payments SET status = 'failed', processed_at = ? WHERE id = ?")
      .run(processedAt, payment.id);
    await database
      .prepare(
        "UPDATE sponsors SET status = 'refunded', is_visible = 0, updated_at = ? WHERE id = ?",
      )
      .run(processedAt, payment.sponsor_id);
    await clearSpotPending(payment.id);
    await clearSpotOccupant(payment.sponsor_id);
  });
}

export async function findPaymentForWebhook(input: {
  paymentId?: string | null;
  sessionId?: string | null;
  dodoPaymentId?: string | null;
}) {
  const db = await getDb();
  if (input.sessionId) {
    const bySession = await db
      .prepare("SELECT * FROM payments WHERE dodo_session_id = ?")
      .get<PaymentRow>(input.sessionId);
    if (bySession) return bySession;
  }
  if (input.paymentId) {
    const byId = await getPayment(input.paymentId);
    if (byId) return byId;
  }
  if (input.dodoPaymentId) {
    const byDodo = await db
      .prepare("SELECT * FROM payments WHERE dodo_payment_id = ?")
      .get<PaymentRow>(input.dodoPaymentId);
    if (byDodo) return byDodo;
  }
  return null;
}

export async function markWebhookProcessed(eventId: string) {
  const db = await getDb();
  const result = await db
    .prepare(
      "INSERT OR IGNORE INTO processed_webhooks (event_id, processed_at) VALUES (?, ?)",
    )
    .run(eventId, nowIso());
  return result.changes > 0;
}

export async function unmarkWebhookProcessed(eventId: string) {
  const db = await getDb();
  await db.prepare("DELETE FROM processed_webhooks WHERE event_id = ?").run(eventId);
}

export async function getPaymentById(id: string) {
  return getPayment(id);
}

export async function getSponsorById(id: string) {
  return getSponsor(id);
}

export async function syncPendingDodoPayment(id: string) {
  const payment = await getPayment(id);
  if (!payment || payment.status !== "pending" || payment.provider !== "dodo") {
    return payment;
  }
  if (!payment.dodo_session_id) return payment;
  const client = getDodoClient();
  if (!client) return payment;

  try {
    const session = await client.checkoutSessions.retrieve(payment.dodo_session_id);
    if (session.payment_status === "succeeded") {
      const result = await confirmPayment(payment.id, {
        dodoPaymentId: session.payment_id ?? null,
        dodoSessionId: session.id,
      });
      if (!result.alreadyProcessed && session.payment_id) {
        const paid = await client.payments.retrieve(session.payment_id);
        await reportDodoPaymentToDataFast(paid);
      }
    } else if (
      session.payment_status === "failed" ||
      session.payment_status === "cancelled"
    ) {
      await failPayment(payment.id);
    }
  } catch (error) {
    console.error("Dodo session sync failed", error);
  }

  return getPayment(id);
}

/** Buyer left checkout: free the spots, but keep the payment open in case they still pay. */
export async function releaseCheckoutHold(id: string) {
  const payment = await syncPendingDodoPayment(id);
  if (!payment) throw new HttpError(404, "Payment not found.");
  if (payment.status === "pending") await clearSpotPending(payment.id);
  return payment.status;
}

export async function getPaymentPublicStatus(id: string) {
  await syncPendingDodoPayment(id);
  const payment = await getPayment(id);
  if (!payment) throw new HttpError(404, "Payment not found.");
  const sponsor = await getSponsor(payment.sponsor_id);
  return {
    payment: {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      provider: payment.provider,
      mock: payment.provider === "mock",
    },
    sponsor: sponsor
      ? {
          id: sponsor.id,
          displayName: displayNameFor(sponsor),
          amount: sponsor.amount,
          status: sponsor.status,
        }
      : null,
  };
}
