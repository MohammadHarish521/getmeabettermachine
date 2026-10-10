import { fetchListingMeta } from "@/lib/listing-meta";
import { jsonError, HttpError } from "@/lib/http";
import { normalizeSponsorUrl } from "@/lib/urls";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("u")?.trim() || "";
    if (!raw) throw new HttpError(400, "Missing url.");
    const website = normalizeSponsorUrl(raw);
    return Response.json(await fetchListingMeta(website));
  } catch (error) {
    return jsonError(error);
  }
}
