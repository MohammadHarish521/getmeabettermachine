import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { MACHINE_TIERS } from "@/config/machine-tiers";
import { SPOTS } from "@/config/spots";
import { FOUNDER_SPONSOR, SITE_DEFAULTS } from "@/config/site";
import { env } from "@/lib/env";
import { formatUsd, letterLogo } from "@/lib/format";

const globalForDb = globalThis as unknown as {
  __raiseMyMacDb?: Database.Database;
};

export function nowIso() {
  return new Date().toISOString();
}

export function getDb() {
  if (!globalForDb.__raiseMyMacDb) {
    const configured = env("DB_PATH");
    const dbPath = configured
      ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configured)
      : process.env.VERCEL
        ? path.join("/tmp", "raise-my-mac.db")
        : path.join(process.cwd(), "data", "raise-my-mac.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const created = new Database(dbPath);
    created.pragma("journal_mode = WAL");
    created.pragma("foreign_keys = ON");
    globalForDb.__raiseMyMacDb = created;
  }

  const db = globalForDb.__raiseMyMacDb;
  // Always migrate. Hot reload reuses this connection from before
  // later tables (like spots) existed.
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      x_url TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      checkout_id TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      sponsor_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      dodo_session_id TEXT,
      dodo_payment_id TEXT,
      checkout_url TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT,
      FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS processed_webhooks (
      event_id TEXT PRIMARY KEY,
      processed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS machine_tiers (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      amount_required INTEGER NOT NULL,
      machine_name TEXT NOT NULL,
      chip TEXT NOT NULL,
      memory TEXT NOT NULL,
      storage TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      short_label TEXT NOT NULL,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      sponsor_id TEXT,
      tier_id TEXT,
      amount INTEGER,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sponsors_status_created
      ON sponsors(status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_sponsors_paid_amount
      ON sponsors(status, amount DESC);

    CREATE TABLE IF NOT EXISTS spots (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      number INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      base_price INTEGER NOT NULL,
      size TEXT NOT NULL,
      surface TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      occupant_sponsor_id TEXT,
      current_amount INTEGER NOT NULL DEFAULT 0,
      pending_payment_id TEXT,
      pending_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_activity_created
      ON activity_events(created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_dodo_session
      ON payments(dodo_session_id)
      WHERE dodo_session_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_dodo_payment
      ON payments(dodo_payment_id)
      WHERE dodo_payment_id IS NOT NULL;
  `);

  seedTiersIfEmpty(db);
  upsertDefaultSpots(db);
  seedSettingsIfEmpty(db);
  addColumn(db, "sponsors", "spot_id", "TEXT");
  seedFounderSponsor(db);
}

export function seedTiersIfEmpty(db = getDb()) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM machine_tiers").get() as {
    count: number;
  };
  if (row.count > 0) return;
  insertDefaultTiers(db);
}

export function insertDefaultTiers(db = getDb()) {
  const insert = db.prepare(
    `INSERT INTO machine_tiers (
       id, sort_order, amount_required, machine_name, chip, memory, storage,
       description, short_label, image
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const apply = db.transaction(() => {
    db.exec("DELETE FROM machine_tiers");
    for (const tier of MACHINE_TIERS) {
      insert.run(
        tier.id,
        tier.sortOrder,
        tier.amountRequired,
        tier.machineName,
        tier.chip,
        tier.memory,
        tier.storage,
        tier.description,
        tier.shortLabel,
        tier.image ?? null,
      );
    }
  });

  apply();
}

export function seedSpotsIfEmpty(db = getDb()) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM spots").get() as {
    count: number;
  };
  if (row.count > 0) return;
  upsertDefaultSpots(db);
}

export function upsertDefaultSpots(db = getDb()) {
  const insert = db.prepare(
    `INSERT INTO spots (
       id, sort_order, number, name, description, base_price, size, surface, x, y,
       occupant_sponsor_id, current_amount, pending_payment_id, pending_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, NULL, NULL)
     ON CONFLICT(id) DO UPDATE SET
       sort_order = excluded.sort_order,
       number = excluded.number,
       name = excluded.name,
       description = excluded.description,
       base_price = excluded.base_price,
       size = excluded.size,
       surface = excluded.surface,
       x = excluded.x,
       y = excluded.y`,
  );

  const apply = db.transaction(() => {
    for (const spot of SPOTS) {
      insert.run(
        spot.id,
        spot.number,
        spot.number,
        spot.name,
        spot.description,
        spot.price,
        spot.size,
        spot.surface,
        spot.x,
        spot.y,
      );
    }
  });

  apply();
}

function addColumn(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (cols.some((col) => col.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function seedSettingsIfEmpty(db: Database.Database) {
  const existing = db
    .prepare("SELECT key FROM site_settings WHERE key = 'site'")
    .get() as { key: string } | undefined;
  if (existing) return;
  db.prepare(
    "INSERT INTO site_settings (key, value, updated_at) VALUES ('site', ?, ?)",
  ).run(JSON.stringify(SITE_DEFAULTS), nowIso());
}

function seedFounderSponsor(db: Database.Database) {
  const now = nowIso();

  db.prepare(
    `UPDATE sponsors
     SET status = 'hidden', is_visible = 0, updated_at = ?
     WHERE name = 'Acme Labs' AND status = 'paid'`,
  ).run(now);
  db.prepare(
    `UPDATE spots
     SET occupant_sponsor_id = NULL, current_amount = 0
     WHERE occupant_sponsor_id IN (
       SELECT id FROM sponsors WHERE name = 'Acme Labs'
     )`,
  ).run();
  db.prepare(
    `DELETE FROM activity_events WHERE label LIKE 'Acme took %'`,
  ).run();

  db.prepare(
    `INSERT INTO sponsors (
       id, name, company, website, x_url, logo_url, message, amount, currency,
       status, payment_id, checkout_id, is_anonymous, is_visible, spot_id,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', 'paid', ?, NULL, 0, 1, NULL, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       company = excluded.company,
       website = excluded.website,
       x_url = excluded.x_url,
       message = excluded.message,
       amount = excluded.amount,
       logo_url = excluded.logo_url,
       status = 'paid',
       is_visible = 1,
       payment_id = excluded.payment_id,
       updated_at = excluded.updated_at`,
  ).run(
    FOUNDER_SPONSOR.id,
    FOUNDER_SPONSOR.name,
    FOUNDER_SPONSOR.company,
    FOUNDER_SPONSOR.website,
    FOUNDER_SPONSOR.website,
    letterLogo(FOUNDER_SPONSOR.name),
    FOUNDER_SPONSOR.message,
    FOUNDER_SPONSOR.amount,
    FOUNDER_SPONSOR.paymentId,
    now,
    now,
  );

  db.prepare(
    `INSERT INTO payments (
       id, sponsor_id, amount, status, provider, created_at, processed_at
     ) VALUES (?, ?, ?, 'succeeded', 'mock', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       amount = excluded.amount,
       status = 'succeeded',
       processed_at = COALESCE(payments.processed_at, excluded.processed_at)`,
  ).run(
    FOUNDER_SPONSOR.paymentId,
    FOUNDER_SPONSOR.id,
    FOUNDER_SPONSOR.amount,
    now,
    now,
  );

  const seedActivity = (
    id: string,
    type: "sponsor" | "unlock",
    label: string,
    amount: number | null,
    tierId: string | null,
  ) => {
    const exists = db
      .prepare("SELECT id FROM activity_events WHERE id = ?")
      .get(id) as { id: string } | undefined;
    if (exists) return;
    db.prepare(
      `INSERT INTO activity_events (id, type, sponsor_id, tier_id, amount, label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      type,
      type === "sponsor" ? FOUNDER_SPONSOR.id : null,
      tierId,
      amount,
      label,
      now,
    );
  };

  const founderLabel = `I put in ${formatUsd(FOUNDER_SPONSOR.amount)} to start`;
  const founderActivity = db
    .prepare("SELECT id FROM activity_events WHERE id = ?")
    .get("founder-self-activity") as { id: string } | undefined;
  if (founderActivity) {
    db.prepare(
      "UPDATE activity_events SET label = ?, amount = ? WHERE id = ?",
    ).run(founderLabel, FOUNDER_SPONSOR.amount, "founder-self-activity");
  } else {
    seedActivity(
      "founder-self-activity",
      "sponsor",
      founderLabel,
      FOUNDER_SPONSOR.amount,
      null,
    );
  }

  const dropUnlock = db.prepare("DELETE FROM activity_events WHERE id = ?");
  for (const tier of MACHINE_TIERS) {
    const eventId = `founder-unlock-${tier.id}`;
    if (FOUNDER_SPONSOR.amount < tier.amountRequired) {
      dropUnlock.run(eventId);
      continue;
    }
    seedActivity(
      eventId,
      "unlock",
      `${tier.shortLabel} configuration unlocked`,
      null,
      tier.id,
    );
  }
  dropUnlock.run("founder-unlock-mini-pro-48-1tb");
}
