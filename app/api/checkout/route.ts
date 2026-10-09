import { cookies } from "next/headers";
import { jsonError } from "@/lib/http";
import { createSponsorshipCheckout } from "@/lib/payments";
import { assertProductionPayments } from "@/lib/dodo";
import { datafastVisitorId } from "@/lib/datafast-id";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertProductionPayments();
    const body = (await request.json()) as Record<string, unknown>;
    const jar = await cookies();
    const result = await createSponsorshipCheckout({
      spotId: typeof body.spotId === "string" ? body.spotId : "",
      amount: body.amount,
      website: typeof body.website === "string" ? body.website : "",
      datafastVisitorId: datafastVisitorId(jar.get("datafast_visitor_id")?.value),
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
