import { initDataFast, type DataFastWeb } from "datafast";

/** Public DataFast website id. The account can only track one site today. */
export const DATAFAST_WEBSITE_ID =
  process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID || "dfid_oNzdikU2lkcWAsFr4pFF7";

let client: DataFastWeb | null = null;
let pending: Promise<DataFastWeb | null> | null = null;

export function bootDataFast() {
  if (typeof window === "undefined") return pending;
  if (!DATAFAST_WEBSITE_ID) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  if (pending) return pending;

  pending = initDataFast({
    websiteId: DATAFAST_WEBSITE_ID,
    autoCapturePageviews: true,
    allowLocalhost: process.env.NODE_ENV !== "production",
  })
    .then((next) => {
      client = next;
      return next;
    })
    .catch((error) => {
      console.warn("DataFast failed to start", error);
      pending = null;
      return null;
    });

  return pending;
}

/** Wait until the visitor cookie exists before checkout. */
export async function ensureDataFast() {
  const analytics = await bootDataFast();
  if (analytics) await analytics.flush().catch(() => undefined);
  return analytics;
}
