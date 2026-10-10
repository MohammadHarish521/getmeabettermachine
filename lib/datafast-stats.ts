import { env } from "@/lib/env";

const API = "https://datafa.st/api/v1";
const TRACKING_ID = "dfid_B3o3P3Z0FETAZbOhZRj49";
const CACHE_MS = 60_000;

export type DataFastStats = {
  live: number | null;
  visitors: number | null;
  views: number | null;
  revenue: number | null;
};

type Envelope = {
  data?: unknown;
  error?: unknown;
  message?: unknown;
};

let cache: { at: number; stats: DataFastStats | null } | null = null;
let inflight: Promise<DataFastStats | null> | null = null;
let websiteId: string | null = null;

export function getDataFastStats() {
  if (!env("DATAFAST_API_KEY")) return Promise.resolve(null);
  if (cache && Date.now() - cache.at < CACHE_MS) return Promise.resolve(cache.stats);
  if (inflight) return inflight;
  inflight = load()
    .then((stats) => {
      cache = { at: Date.now(), stats };
      return stats;
    })
    .catch((error: unknown) => {
      console.error(
        "DataFast stats failed",
        error instanceof Error ? error.message : error,
      );
      cache = { at: Date.now(), stats: null };
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

async function load(): Promise<DataFastStats> {
  const [overviewResult, realtimeResult] = await Promise.allSettled([
    datafastGet("/analytics/overview", { fields: "visitors,revenue,pageviews" }),
    datafastGet("/analytics/realtime", { fields: "visitors" }),
  ]);

  const overview =
    overviewResult.status === "fulfilled" ? asOverview(overviewResult.value) : emptyOverview();
  const live =
    realtimeResult.status === "fulfilled"
      ? asCount(realtimeResult.value, "visitors", "count")
      : null;

  if (overviewResult.status === "rejected" && realtimeResult.status === "rejected") {
    throw overviewResult.reason;
  }

  return {
    live,
    visitors: overview.visitors,
    views: overview.views,
    revenue: overview.revenue,
  };
}

function emptyOverview() {
  return { visitors: null, revenue: null, views: null };
}

async function datafastGet(path: string, query: Record<string, string> = {}) {
  const key = env("DATAFAST_API_KEY");
  const url = new URL(`${API}${path}`);
  for (const [name, value] of Object.entries(query)) {
    if (value) url.searchParams.set(name, value);
  }
  if (key.startsWith("dft_")) {
    url.searchParams.set("websiteId", await websiteIdForToken(key));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  const body = (await response.json().catch(() => ({}))) as Envelope;
  if (!response.ok) {
    throw new Error(errorText(body.error) || errorText(body.message) || `DataFast ${response.status}`);
  }
  return body.data;
}

async function websiteIdForToken(key: string) {
  if (websiteId) return websiteId;
  const response = await fetch(`${API}/admin/websites`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  const body = (await response.json().catch(() => ({}))) as Envelope;
  if (!response.ok) {
    throw new Error(errorText(body.error) || errorText(body.message) || `DataFast ${response.status}`);
  }
  const sites = asList<Record<string, unknown>>(body.data);
  const match = sites.find((site) => {
    const tracking = String(site.trackingId ?? "");
    const domain = String(site.domain ?? "").toLowerCase();
    return (
      tracking === TRACKING_ID ||
      domain === "www.raisemymini.com" ||
      domain === "raisemymini.com"
    );
  });
  const id = stringField(match, "websiteId") || stringField(match, "_id") || stringField(match, "id");
  if (!id) throw new Error("DataFast account token could not find www.raisemymini.com");
  websiteId = id;
  return id;
}

function stringField(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const record = asRecord(value);
  if (Array.isArray(record?.data)) return record.data as T[];
  return [];
}

function metric(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function asCount(value: unknown, ...keys: string[]) {
  const list = asList<Record<string, unknown>>(value);
  const record = list[0] ?? asRecord(value);
  if (!record) return null;
  return metric(record, ...keys);
}

function asOverview(value: unknown) {
  const list = asList<Record<string, unknown>>(value);
  const record = list[0] ?? asRecord(value);
  if (!record) return emptyOverview();
  return {
    visitors: metric(record, "visitors"),
    revenue: metric(record, "revenue"),
    views: metric(record, "pageviews", "page_views", "views"),
  };
}

function errorText(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  if (!record) return "";
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  const nested = asRecord(record.error);
  if (typeof nested?.message === "string" && nested.message.trim()) return nested.message.trim();
  return "";
}
