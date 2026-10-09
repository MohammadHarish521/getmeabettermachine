import { getDb, nowIso } from "@/lib/db";
import type { MachineTier } from "@/lib/types";

export async function listMachineTiers(): Promise<MachineTier[]> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT id, sort_order, amount_required, machine_name, chip, memory, storage,
              description, short_label, image
       FROM machine_tiers
       ORDER BY sort_order ASC, amount_required ASC`,
    )
    .all<{
    id: string;
    sort_order: number;
    amount_required: number;
    machine_name: string;
    chip: string;
    memory: string;
    storage: string;
    description: string;
    short_label: string;
    image: string | null;
  }>();

  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sort_order,
    amountRequired: row.amount_required,
    machineName: row.machine_name,
    chip: row.chip,
    memory: row.memory,
    storage: row.storage,
    description: row.description,
    shortLabel: row.short_label,
    image: row.image,
  }));
}

export async function updateMachineTier(
  id: string,
  patch: Partial<
    Pick<
      MachineTier,
      | "sortOrder"
      | "amountRequired"
      | "machineName"
      | "chip"
      | "memory"
      | "storage"
      | "description"
      | "shortLabel"
      | "image"
    >
  >,
) {
  const current = (await listMachineTiers()).find((tier) => tier.id === id);
  if (!current) return null;
  const next = { ...current, ...patch };
  const db = await getDb();
  await db
    .prepare(
      `UPDATE machine_tiers
       SET sort_order = ?, amount_required = ?, machine_name = ?, chip = ?,
           memory = ?, storage = ?, description = ?, short_label = ?, image = ?
       WHERE id = ?`,
    )
    .run(
      next.sortOrder,
      next.amountRequired,
      next.machineName,
      next.chip,
      next.memory,
      next.storage,
      next.description,
      next.shortLabel,
      next.image,
      id,
    );
  return next;
}

export async function createMachineTier(tier: MachineTier) {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO machine_tiers (
         id, sort_order, amount_required, machine_name, chip, memory, storage,
         description, short_label, image
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      tier.id,
      tier.sortOrder,
      tier.amountRequired,
      tier.machineName,
      tier.chip,
      tier.memory,
      tier.storage,
      tier.description,
      tier.shortLabel,
      tier.image,
    );
  return tier;
}

export async function deleteMachineTier(id: string) {
  const db = await getDb();
  await db.prepare("DELETE FROM machine_tiers WHERE id = ?").run(id);
}

export async function touchSettingsTimestamp() {
  const db = await getDb();
  await db
    .prepare("UPDATE site_settings SET updated_at = ? WHERE key = 'site'")
    .run(nowIso());
}
