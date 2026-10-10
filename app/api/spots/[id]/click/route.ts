import { jsonError } from "@/lib/http";
import { incrementSpotClicks } from "@/lib/spots";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const clicks = await incrementSpotClicks(id);
    return Response.json({ clicks });
  } catch (error) {
    return jsonError(error);
  }
}
