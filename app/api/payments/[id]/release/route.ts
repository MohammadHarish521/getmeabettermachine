import { jsonError } from "@/lib/http";
import { releaseCheckoutHold } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const status = await releaseCheckoutHold(id);
    return Response.json({ paymentId: id, status });
  } catch (error) {
    return jsonError(error);
  }
}
