import { jsonError, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/admin-auth";
import { listPublicSpots, updateSpotPrice } from "@/lib/spots";
import { upsertDefaultSpots } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ spots: listPublicSpots() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { action?: string };
    if (body.action === "reset") {
      upsertDefaultSpots();
      return Response.json({ spots: listPublicSpots() });
    }
    throw new HttpError(400, "Unknown action.");
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { id?: string; basePrice?: number };
    if (!body.id) throw new HttpError(400, "id is required.");
    if (typeof body.basePrice !== "number" || body.basePrice < 1) {
      throw new HttpError(400, "basePrice must be a positive dollar amount.");
    }
    updateSpotPrice(body.id, Math.round(body.basePrice));
    return Response.json({ spots: listPublicSpots() });
  } catch (error) {
    return jsonError(error);
  }
}
