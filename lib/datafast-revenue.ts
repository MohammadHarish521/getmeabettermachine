import { datafastVisitorId } from "@/lib/datafast-id";
import { env } from "@/lib/env";

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const THREE_DECIMAL = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

function majorUnits(totalAmount: number, currency: string) {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return totalAmount;
  if (THREE_DECIMAL.has(code)) return totalAmount / 1000;
  return totalAmount / 100;
}

/** Tell DataFast about a paid Dodo charge so it can attribute the revenue. */
export async function reportDodoPaymentToDataFast(data: {
  payment_id?: string;
  total_amount?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
}) {
  const key = env("DATAFAST_API_KEY");
  if (!key || !data.payment_id || typeof data.total_amount !== "number") return;

  const currency = (data.currency || "USD").toUpperCase();
  const visitor = datafastVisitorId(
    typeof data.metadata?.datafast_visitor_id === "string"
      ? data.metadata.datafast_visitor_id
      : null,
  );

  const response = await fetch(await paymentsUrl(key), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: majorUnits(data.total_amount, currency),
      currency,
      transaction_id: data.payment_id,
      ...(visitor ? { datafast_visitor_id: visitor } : {}),
    }),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    console.error("DataFast payment report failed", response.status, text.slice(0, 300));
    return;
  }
  console.info("DataFast payment recorded", data.payment_id, text.slice(0, 180));
}

let paymentsEndpoint: Promise<string> | null = null;

function paymentsUrl(key: string) {
  if (!paymentsEndpoint) paymentsEndpoint = resolvePaymentsUrl(key);
  return paymentsEndpoint;
}

async function resolvePaymentsUrl(key: string) {
  if (!key.startsWith("dft_")) return "https://datafa.st/api/v1/payments";
  const response = await fetch("https://datafa.st/api/v1/admin/websites", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: Array<{ websiteId?: string; trackingId?: string; domain?: string }>;
  } | null;
  const website = body?.data?.find(
    (item) =>
      item.trackingId === "dfid_B3o3P3Z0FETAZbOhZRj49" ||
      item.domain === "www.raisemymini.com" ||
      item.domain === "raisemymini.com",
  );
  if (!website?.websiteId) {
    throw new Error("DataFast account token could not find www.raisemymini.com");
  }
  return `https://datafa.st/api/v1/payments?websiteId=${website.websiteId}`;
}
