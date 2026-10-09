import { jsonError, HttpError } from "@/lib/http";
import { failPayment, getPaymentById } from "@/lib/payments";
import { isDodoConfigured } from "@/lib/dodo";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (isDodoConfigured()) {
      throw new HttpError(
        403,
        "Mock payments are disabled when Dodo is configured.",
      );
    }
    const { id } = await context.params;
    const payment = await getPaymentById(id);
    if (!payment) throw new HttpError(404, "Payment not found.");
    if (payment.provider !== "mock") {
      throw new HttpError(400, "This payment is not a mock checkout.");
    }
    await failPayment(payment.id);
    return Response.json({ paymentId: payment.id, status: "failed" });
  } catch (error) {
    return jsonError(error);
  }
}
