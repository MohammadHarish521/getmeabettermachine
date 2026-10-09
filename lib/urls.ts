import { HttpError } from "@/lib/http";

const MAX_URL = 500;

export function isPrivateHost(host: string) {
  const name = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    name === "localhost" ||
    name.endsWith(".localhost") ||
    name === "::1" ||
    name === "0.0.0.0"
  ) {
    return true;
  }
  if (/^127\./.test(name) || /^10\./.test(name) || /^192\.168\./.test(name)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(name)) return true;
  if (/^169\.254\./.test(name)) return true;
  return false;
}

export function normalizeHttpUrl(raw: string, label = "URL") {
  let url = raw.trim();
  if (!url) return "";
  if (url.length > MAX_URL) {
    throw new HttpError(400, `${label} is too long.`);
  }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new HttpError(400, `Enter a valid ${label.toLowerCase()}.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new HttpError(400, `Enter a valid ${label.toLowerCase()}.`);
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new HttpError(400, `${label} must be a public website.`);
  }
  return parsed.toString();
}

export function normalizeOptionalHttpUrl(raw: string | undefined, label: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  return normalizeHttpUrl(value, label);
}

export function normalizeXUrl(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  if (value.startsWith("@")) {
    const handle = value.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
    if (!handle) throw new HttpError(400, "Enter a valid X handle.");
    return `https://x.com/${handle}`;
  }
  return normalizeHttpUrl(value, "X profile");
}

export function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeSponsorUrl(raw: string) {
  let url = raw.trim();
  if (!url) throw new HttpError(400, "Paste the URL you want on that sticker.");
  if (url.startsWith("@")) {
    const handle = url.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
    if (!handle) throw new HttpError(400, "Enter a valid @handle.");
    url = `https://x.com/${handle}`;
  }
  return normalizeHttpUrl(url, "Website");
}

export function siteIconPath(site: string) {
  if (!site.trim()) return "";
  return `/api/favicon?u=${encodeURIComponent(site.trim())}`;
}
