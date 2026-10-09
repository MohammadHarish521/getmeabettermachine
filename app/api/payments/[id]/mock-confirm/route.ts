import { jsonError, HttpError } from "@/lib/http";
import {
  confirmPayment,
  getPaymentById,
} from "@/lib/payments";
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
    const payment = getPaymentById(id);
    if (!payment) throw new HttpError(404, "Payment not found.");
    if (payment.provider !== "mock") {
      throw new HttpError(400, "This payment is not a mock checkout.");
    }
    const result = confirmPayment(payment.id);
    return Response.json({
      paymentId: result.payment.id,
      status: result.payment.status,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    return jsonError(error);
  }
}
