import { env } from "@/lib/env";
import { jsonError, HttpError } from "@/lib/http";
import {
  confirmPayment,
  failPayment,
  findPaymentForWebhook,
  markWebhookProcessed,
  refundPayment,
  unmarkWebhookProcessed,
} from "@/lib/payments";
import { unwrapDodoWebhook } from "@/lib/dodo";
import { reportDodoPaymentToDataFast } from "@/lib/datafast-revenue";

export const runtime = "nodejs";

function headerValue(request: Request, name: string) {
  return request.headers.get(name) ?? "";
}

function metadataString(
  meta: Record<string, unknown> | undefined,
  key: string,
) {
  const value = meta?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  try {
    const secret = env("DODO_PAYMENTS_WEBHOOK_KEY");
    if (!secret) {
      throw new HttpError(503, "Dodo webhook secret is not configured.");
    }

    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    for (const key of ["webhook-id", "webhook-signature", "webhook-timestamp"]) {
      const value = headerValue(request, key);
      if (value) headers[key] = value;
    }

    let event: ReturnType<typeof unwrapDodoWebhook>;
    try {
      event = unwrapDodoWebhook(rawBody, headers);
    } catch (error) {
      console.error("Dodo webhook signature failed", error);
      return Response.json({ error: "Invalid webhook signature." }, { status: 403 });
    }

    const eventId =
      headers["webhook-id"] || `${event.type}:${event.timestamp}:${Date.now()}`;
    if (!(await markWebhookProcessed(eventId))) {
      return new Response("", { status: 202 });
    }

    try {
      const data = "data" in event ? event.data : null;
      const paymentMeta =
        data && typeof data === "object" && "metadata" in data
          ? (data.metadata as Record<string, unknown> | undefined)
          : undefined;
      const dodoPaymentId =
        data && typeof data === "object" && "payment_id" in data
          ? String((data as { payment_id?: unknown }).payment_id ?? "")
          : "";
      const sessionId =
        data && typeof data === "object" && "checkout_session_id" in data
          ? String((data as { checkout_session_id?: unknown }).checkout_session_id ?? "")
          : "";

      const payment = await findPaymentForWebhook({
        paymentId: metadataString(paymentMeta, "paymentId"),
        dodoPaymentId: dodoPaymentId || null,
        sessionId: sessionId || null,
      });

      if (event.type === "payment.succeeded") {
        if (payment) {
          await confirmPayment(payment.id, {
            dodoPaymentId: dodoPaymentId || null,
          });
        }
        if (data && typeof data === "object") {
          const paid = data as {
            payment_id?: string;
            total_amount?: number;
            currency?: string;
            metadata?: Record<string, unknown> | null;
          };
          await reportDodoPaymentToDataFast({
            payment_id: paid.payment_id || dodoPaymentId,
            total_amount: paid.total_amount,
            currency: paid.currency,
            metadata: paid.metadata ?? paymentMeta,
          });
        }
      }

      if (
        (event.type === "payment.failed" || event.type === "payment.cancelled") &&
        payment
      ) {
        await failPayment(payment.id);
      }

      if (event.type === "refund.succeeded" && payment) {
        await refundPayment(payment.id);
      }
    } catch (error) {
      await unmarkWebhookProcessed(eventId);
      throw error;
    }

    return new Response("", { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
