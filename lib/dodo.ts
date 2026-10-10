import DodoPayments from "dodopayments";
import { env, getAppUrl } from "@/lib/env";

export function isDodoConfigured() {
  return Boolean(env("DODO_PAYMENTS_API_KEY") && env("DODO_PRODUCT_ID"));
}

export function getDodoEnvironment(): "test_mode" | "live_mode" {
  const explicit = env("DODO_PAYMENTS_ENV");
  if (explicit === "live_mode" || explicit === "test_mode") return explicit;
  return env("NODE_ENV") === "production" ? "live_mode" : "test_mode";
}

export function assertProductionPayments() {
  const productionLike =
    env("NODE_ENV") === "production" &&
    !/localhost|127\.0\.0\.1/i.test(getAppUrl());
  if (!productionLike) return;

  if (/localhost|127\.0\.0\.1/i.test(getAppUrl())) {
    throw new Error(
      "Production APP_URL must be a public https origin — localhost would send paying customers to your laptop.",
    );
  }
  if (getDodoEnvironment() !== "live_mode") {
    throw new Error(
      "DODO_PAYMENTS_ENV must be live_mode in production. Test keys cannot take real payments.",
    );
  }
  if (!isDodoConfigured() || !env("DODO_PAYMENTS_WEBHOOK_KEY")) {
    throw new Error(
      "Set DODO_PAYMENTS_API_KEY, DODO_PRODUCT_ID, and DODO_PAYMENTS_WEBHOOK_KEY from the Live dashboard (Test Mode off).",
    );
  }
}

export function getDodoClient() {
  if (!isDodoConfigured()) return null;

  return new DodoPayments({
    bearerToken: env("DODO_PAYMENTS_API_KEY"),
    webhookKey: env("DODO_PAYMENTS_WEBHOOK_KEY") || null,
    environment: getDodoEnvironment(),
  });
}

export async function createDodoCheckout(input: {
  paymentId: string;
  sponsorId: string;
  amountDollars: number;
  sponsorName: string;
  datafastVisitorId?: string | null;
}) {
  const client = getDodoClient();
  const productId = env("DODO_PRODUCT_ID");
  if (!client || !productId) {
    throw new Error("Dodo Payments is not configured");
  }

  const amountCents = input.amountDollars * 100;
  const appUrl = getAppUrl();

  const session = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: amountCents,
      },
    ],
    billing_currency: "USD",
    return_url: `${appUrl}/sponsor/success?ref=${input.paymentId}`,
    cancel_url: `${appUrl}/sponsor/cancel?ref=${input.paymentId}`,
    metadata: {
      paymentId: input.paymentId,
      sponsorId: input.sponsorId,
      amount: String(input.amountDollars),
      kind: "raise-my-mac",
      sponsorName: input.sponsorName.slice(0, 120),
      ...(input.datafastVisitorId
        ? { datafast_visitor_id: input.datafastVisitorId }
        : {}),
    },
  });

  if (!session.checkout_url) {
    throw new Error("Dodo did not return a checkout URL");
  }

  return {
    id: session.session_id,
    url: session.checkout_url,
  };
}

export function dodoErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const record = error as { error?: { code?: unknown }; code?: unknown };
  if (typeof record.error?.code === "string" && record.error.code.trim()) {
    return record.error.code.trim();
  }
  if (typeof record.code === "string" && record.code.trim()) {
    return record.code.trim();
  }
  return null;
}

export function unwrapDodoWebhook(
  rawBody: string,
  headers: Record<string, string>,
) {
  const client = getDodoClient();
  const key = env("DODO_PAYMENTS_WEBHOOK_KEY");
  if (!client || !key) {
    throw new Error("Dodo webhook key is not configured");
  }
  return client.webhooks.unwrap(rawBody, { headers, key });
}
