import { jsonError } from "@/lib/http";
import { getPaymentPublicStatus } from "@/lib/payments";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return Response.json(getPaymentPublicStatus(id));
  } catch (error) {
    return jsonError(error);
  }
}
