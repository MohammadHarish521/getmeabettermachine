import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  adminPasswordMatches,
  createAdminToken,
  isAdminConfigured,
} from "@/lib/admin-auth";
import { HttpError, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) {
      throw new HttpError(503, "Admin is not configured.");
    }
    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";
    if (!(await adminPasswordMatches(password))) {
      throw new HttpError(401, "Wrong password.");
    }
    const token = await createAdminToken();
    const cookie = adminCookieOptions(token.expires);
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      ...cookie,
      value: token.value,
    });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
