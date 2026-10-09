import { HttpError } from "@/lib/http";
import { env } from "@/lib/env";

export const ADMIN_COOKIE = "rmm_admin";
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function adminSecret() {
  return env("ADMIN_SECRET") || env("ADMIN_PASSWORD");
}

export function isAdminConfigured() {
  return Boolean(env("ADMIN_PASSWORD"));
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toHex(signature);
}

export async function createAdminToken() {
  const secret = adminSecret();
  if (!secret) throw new Error("Admin is not configured");
  const expires = Date.now() + COOKIE_TTL_MS;
  const payload = `v1.${expires}`;
  const signature = await hmacHex(payload, secret);
  return {
    value: `${payload}.${signature}`,
    expires: new Date(expires),
  };
}

export async function verifyAdminToken(value: string | undefined) {
  if (!value) return false;
  const secret = adminSecret();
  if (!secret) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresRaw, signature] = parts;
  if (version !== "v1" || !expiresRaw || !signature) return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = await hmacHex(`v1.${expiresRaw}`, secret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function adminPasswordMatches(input: string) {
  const expected = env("ADMIN_PASSWORD");
  const secret = adminSecret();
  if (!expected || !secret) return false;
  const left = await hmacHex(input, secret);
  const right = await hmacHex(expected, secret);
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function requireAdmin() {
  if (!isAdminConfigured()) {
    throw new HttpError(503, "Admin is not configured.");
  }
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE)?.value))) {
    throw new HttpError(401, "Unauthorized.");
  }
}

export function adminCookieOptions(expires: Date) {
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env("NODE_ENV") === "production",
    path: "/",
    expires,
  };
}
