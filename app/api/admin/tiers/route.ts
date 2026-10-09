import { jsonError, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createMachineTier,
  deleteMachineTier,
  listMachineTiers,
  updateMachineTier,
} from "@/lib/tiers";
import { insertDefaultTiers } from "@/lib/db";
import type { MachineTier } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ tiers: await listMachineTiers() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { action?: string } & Partial<MachineTier>;
    if (body.action === "reset") {
      await insertDefaultTiers();
      return Response.json({ tiers: await listMachineTiers() });
    }

    if (!body.id || !body.machineName || !body.chip) {
      throw new HttpError(400, "id, machineName and chip are required.");
    }

    const tier: MachineTier = {
      id: String(body.id),
      sortOrder: Number(body.sortOrder) || 0,
      amountRequired: Number(body.amountRequired) || 0,
      machineName: String(body.machineName),
      chip: String(body.chip),
      memory: String(body.memory ?? ""),
      storage: String(body.storage ?? ""),
      description: String(body.description ?? ""),
      shortLabel: String(body.shortLabel ?? body.chip),
      image: body.image ?? null,
    };
    await createMachineTier(tier);
    return Response.json({ tier }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { id?: string } & Partial<MachineTier>;
    if (!body.id) throw new HttpError(400, "id is required.");
    const updated = await updateMachineTier(body.id, body);
    if (!updated) throw new HttpError(404, "Tier not found.");
    return Response.json({ tier: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { id?: string };
    if (!body.id) throw new HttpError(400, "id is required.");
    await deleteMachineTier(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
