import { isPrivateHost } from "@/lib/urls";

const FETCH_MS = 3500;
const TITLE_MAX = 80;
const DESCRIPTION_MAX = 220;
const CACHE_MS = 10 * 60_000;

const listingCache = new Map<string, { at: number; meta: ListingMeta }>();

function cacheKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

export function cachedListingMeta(url: string): ListingMeta | null {
  const hit = listingCache.get(cacheKey(url));
  if (!hit || Date.now() - hit.at > CACHE_MS) return null;
  return hit.meta;
}

function rememberListingMeta(url: string, meta: ListingMeta) {
  listingCache.set(cacheKey(url), { at: Date.now(), meta });
}

export type ListingMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
};

export async function fetchListingMeta(url: string): Promise<ListingMeta> {
  const empty: ListingMeta = { title: null, description: null, image: null };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return empty;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return empty;
  if (isPrivateHost(parsed.hostname)) return empty;

  const cached = cachedListingMeta(parsed.toString());
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; RaiseMyMac/1.0; +https://raisemymac.com)",
      },
    });
    if (!response.ok) return empty;
    const html = (await response.text()).slice(0, 120_000);
    const title = cleanTitle(
      meta(html, ["og:title", "twitter:title"]) || pageTitle(html),
    );
    const description = cleanText(
      meta(html, ["og:description", "twitter:description", "description"]),
      DESCRIPTION_MAX,
    );
    const image = resolveMetaUrl(
      parsed,
      meta(html, ["og:image", "twitter:image", "twitter:image:src"]),
    );
    const result = { title, description, image };
    rememberListingMeta(parsed.toString(), result);
    return result;
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

function meta(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decode(match[1]);
    }
  }
  return null;
}

function resolveMetaUrl(page: URL, raw: string | null) {
  if (!raw) return null;
  try {
    const resolved = new URL(raw, page);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }
    if (isPrivateHost(resolved.hostname)) return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

function pageTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decode(match[1]) : null;
}

function cleanTitle(value: string | null) {
  if (!value) return null;
  const first = value.split(/\s[|\-–—]\s/)[0] ?? value;
  return cleanText(first, TITLE_MAX);
}

function cleanText(value: string | null, max: number) {
  if (!value) return null;
  const text = decode(value).replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function decode(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(Number.parseInt(n, 16)),
    );
}
