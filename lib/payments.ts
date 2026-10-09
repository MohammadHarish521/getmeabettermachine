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
  isDodoConfigured,
} from "@/lib/dodo";
import {
  hostnameFromUrl,
  normalizeOptionalHttpUrl,
  normalizeSponsorUrl,
  normalizeXUrl,
} from "@/lib/urls";
import { fetchListingMeta } from "@/lib/listing-meta";
import {
  clearSpotOccupant,
  clearSpotPending,
  getSpot,
  holdSpot,
  nextSpotPrice,
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

function getPayment(id: string) {
  return getDb()
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(id) as PaymentRow | undefined;
}

function getSponsor(id: string) {
  return getDb()
    .prepare("SELECT * FROM sponsors WHERE id = ?")
    .get(id) as SponsorRow | undefined;
}

function parseAmount(raw: unknown, floor: number) {
  const settings = getSiteSettings();
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
    throw new HttpError(400, `That spot is $${floor}.`);
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

export async function createSponsorshipCheckout(
  input: CheckoutInput & { datafastVisitorId?: string | null },
) {
  const spotId = typeof input.spotId === "string" ? input.spotId.trim() : "";
  if (!spotId) throw new HttpError(400, "Pick a spot on the machine first.");
  const spot = getSpot(spotId);
  if (!spot) throw new HttpError(404, "That spot does not exist.");

  const amount = parseAmount(input.amount, nextSpotPrice(spot));
  const website = normalizeSponsorUrl(String(input.website ?? ""));
  const meta = await fetchListingMeta(website);
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

  const open = getDb().transaction(() => {
    holdSpot(spotId, paymentId, amount);
    getDb()
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

    getDb()
      .prepare(
        `INSERT INTO payments (
           id, sponsor_id, amount, status, provider, created_at
         ) VALUES (?, ?, ?, 'pending', ?, ?)`,
      )
      .run(paymentId, sponsorId, amount, provider, createdAt);
  });
  open();

  return finalizeCheckout({
    paymentId,
    sponsorId,
    amount,
    sponsorName: `${shownName} · ${spot.name}`,
    provider,
    datafastVisitorId: input.datafastVisitorId,
  });
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

      getDb()
        .prepare(
          "UPDATE payments SET dodo_session_id = ?, checkout_url = ? WHERE id = ?",
        )
        .run(checkout.id, checkout.url, input.paymentId);
      getDb()
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
      markCheckoutFailed(input.paymentId, input.sponsorId);
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
  getDb()
    .prepare("UPDATE payments SET checkout_url = ? WHERE id = ?")
    .run(checkoutUrl, input.paymentId);

  return {
    paymentId: input.paymentId,
    sponsorId: input.sponsorId,
    checkoutUrl,
    mock: true,
  };
}

function markCheckoutFailed(paymentId: string, sponsorId: string) {
  const apply = getDb().transaction(() => {
    getDb().prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(paymentId);
    getDb()
      .prepare("UPDATE sponsors SET status = 'failed', updated_at = ? WHERE id = ?")
      .run(nowIso(), sponsorId);
    clearSpotPending(paymentId);
  });
  apply();
}

function insertActivity(input: {
  type: "sponsor" | "unlock";
  sponsorId?: string | null;
  tierId?: string | null;
  amount?: number | null;
  label: string;
}) {
  getDb()
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

function paidRaised() {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM sponsors WHERE status = 'paid'")
    .get() as { total: number };
  return Number(row.total) || 0;
}

function recordUnlocks(previousRaised: number, nextRaised: number) {
  const tiers = listMachineTiers();
  const before = resolveFunding(previousRaised, tiers);
  const after = resolveFunding(nextRaised, tiers);
  const newly = after.unlocked.filter(
    (tier) => !before.unlocked.some((item) => item.id === tier.id),
  );
  for (const tier of newly) {
    insertActivity({
      type: "unlock",
      tierId: tier.id,
      label: `${tier.chip} ${memoryLabel(tier.memory)} configuration unlocked`,
    });
  }
}

function memoryLabel(memory: string) {
  return memory.replace(/unified memory/i, "").trim();
}

export function confirmPayment(
  paymentId: string,
  extras: { dodoPaymentId?: string | null; dodoSessionId?: string | null } = {},
) {
  const apply = getDb().transaction(() => {
    const payment = getPayment(paymentId);
    if (!payment) throw new HttpError(404, "Payment not found.");

    if (payment.status === "succeeded") {
      const sponsor = getSponsor(payment.sponsor_id);
      if (!sponsor) throw new HttpError(404, "Sponsor not found.");
      return { alreadyProcessed: true, payment, sponsor };
    }

    if (payment.status === "failed") {
      throw new HttpError(409, "This payment can no longer be confirmed.");
    }

    const sponsor = getSponsor(payment.sponsor_id);
    if (!sponsor) throw new HttpError(404, "Sponsor not found.");

    const processedAt = nowIso();
    const previousRaised = paidRaised();

    getDb()
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

    getDb()
      .prepare(
        `UPDATE sponsors
         SET status = 'paid', is_visible = 1, updated_at = ?
         WHERE id = ?`,
      )
      .run(processedAt, sponsor.id);

    const updatedSponsor = getSponsor(sponsor.id)!;
    const updatedPayment = getPayment(payment.id)!;
    const name = displayNameFor(updatedSponsor);
    const spot = updatedSponsor.spot_id ? getSpot(updatedSponsor.spot_id) : null;
    if (updatedSponsor.spot_id) {
      occupySpot(updatedSponsor.spot_id, sponsor.id, sponsor.amount);
    }

    insertActivity({
      type: "sponsor",
      sponsorId: sponsor.id,
      amount: sponsor.amount,
      label: spot
        ? `${name} took ${spot.name} for ${formatUsd(sponsor.amount)}`
        : `${name} sponsored ${formatUsd(sponsor.amount)}`,
    });

    recordUnlocks(previousRaised, previousRaised + sponsor.amount);

    return {
      alreadyProcessed: false,
      payment: updatedPayment,
      sponsor: updatedSponsor,
    };
  });

  return apply();
}

export function failPayment(paymentId: string) {
  const apply = getDb().transaction(() => {
    const payment = getPayment(paymentId);
    if (!payment || payment.status !== "pending") return;
    const processedAt = nowIso();
    getDb()
      .prepare("UPDATE payments SET status = 'failed', processed_at = ? WHERE id = ?")
      .run(processedAt, payment.id);
    getDb()
      .prepare("UPDATE sponsors SET status = 'failed', updated_at = ? WHERE id = ?")
      .run(processedAt, payment.sponsor_id);
    clearSpotPending(payment.id);
  });
  apply();
}

export function refundPayment(paymentId: string) {
  const apply = getDb().transaction(() => {
    const payment = getPayment(paymentId);
    if (!payment) return;
    if (payment.status !== "succeeded" && payment.status !== "pending") return;
    const processedAt = nowIso();
    getDb()
      .prepare("UPDATE payments SET status = 'failed', processed_at = ? WHERE id = ?")
      .run(processedAt, payment.id);
    getDb()
      .prepare(
        "UPDATE sponsors SET status = 'refunded', is_visible = 0, updated_at = ? WHERE id = ?",
      )
      .run(processedAt, payment.sponsor_id);
    clearSpotPending(payment.id);
    clearSpotOccupant(payment.sponsor_id);
  });
  apply();
}

export function findPaymentForWebhook(input: {
  paymentId?: string | null;
  sessionId?: string | null;
  dodoPaymentId?: string | null;
}) {
  const db = getDb();
  if (input.sessionId) {
    const bySession = db
      .prepare("SELECT * FROM payments WHERE dodo_session_id = ?")
      .get(input.sessionId) as PaymentRow | undefined;
    if (bySession) return bySession;
  }
  if (input.paymentId) {
    const byId = getPayment(input.paymentId);
    if (byId) return byId;
  }
  if (input.dodoPaymentId) {
    const byDodo = db
      .prepare("SELECT * FROM payments WHERE dodo_payment_id = ?")
      .get(input.dodoPaymentId) as PaymentRow | undefined;
    if (byDodo) return byDodo;
  }
  return null;
}

export function markWebhookProcessed(eventId: string) {
  const result = getDb()
    .prepare(
      "INSERT OR IGNORE INTO processed_webhooks (event_id, processed_at) VALUES (?, ?)",
    )
    .run(eventId, nowIso());
  return result.changes > 0;
}

export function unmarkWebhookProcessed(eventId: string) {
  getDb().prepare("DELETE FROM processed_webhooks WHERE event_id = ?").run(eventId);
}

export function getPaymentById(id: string) {
  return getPayment(id);
}

export function getSponsorById(id: string) {
  return getSponsor(id);
}

export function getPaymentPublicStatus(id: string) {
  const payment = getPayment(id);
  if (!payment) throw new HttpError(404, "Payment not found.");
  const sponsor = getSponsor(payment.sponsor_id);
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
