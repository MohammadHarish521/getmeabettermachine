"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import type { MachineTier, PublicSpot, SponsorRow } from "@/lib/types";
import type { SiteSettings } from "@/config/site";

type Overview = {
  raised: number;
  sponsorCount: number;
  payments: {
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
  };
  webhookCount: number;
  recentWebhooks: Array<{ event_id: string; processed_at: string }>;
  sponsors: SponsorRow[];
  spots: PublicSpot[];
  tiers: MachineTier[];
  settings: SiteSettings;
  mockPayments: boolean;
};

export function AdminDashboard({ initial }: { initial: Overview }) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/overview");
    const next = (await response.json()) as Overview;
    setData(next);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-mute uppercase">Admin</p>
          <h1 className="mt-1 text-[28px] font-medium tracking-[-0.04em]">Raise My Mac</h1>
        </div>
        <button type="button" className="btn-secondary h-9 text-[13px]" onClick={logout}>
          Log out
        </button>
      </div>

      {data.mockPayments ? (
        <p className="mt-4 text-[13px] text-mute">
          Mock checkout is enabled. Dodo keys are not set on this environment.
        </p>
      ) : null}

      {message ? <p className="mt-4 text-[13px] text-silver">{message}</p> : null}

      <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Raised" value={formatUsd(data.raised)} />
        <Stat label="Visible sponsors" value={String(data.sponsorCount)} />
        <Stat label="Successful payments" value={String(data.payments.succeeded)} />
        <Stat label="Webhooks stored" value={String(data.webhookCount)} />
      </dl>
      <p className="mt-3 text-[12px] text-dim">
        Payments · {data.payments.pending} pending · {data.payments.failed} failed ·{" "}
        {data.payments.total} total
      </p>

      <section className="mt-14">
        <h2 className="text-[18px] font-medium tracking-[-0.03em]">Sponsors</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-mute">
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Visible</th>
                <th className="py-2 pr-4 font-medium">URL</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.sponsors.map((sponsor) => (
                <SponsorRowEditor
                  key={sponsor.id}
                  sponsor={sponsor}
                  onSaved={async () => {
                    setMessage("Sponsor updated.");
                    await refresh();
                  }}
                />
              ))}
            </tbody>
          </table>
          {data.sponsors.length === 0 ? (
            <p className="py-8 text-mute">No sponsors yet.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-medium tracking-[-0.03em]">Spots</h2>
          <button
            type="button"
            className="btn-secondary h-9 text-[13px]"
            onClick={async () => {
              await fetch("/api/admin/spots", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
              });
              setMessage("Spot prices reloaded from config/spots.ts.");
              await refresh();
            }}
          >
            Reload defaults from config
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {(data.spots ?? []).map((spot) => (
            <SpotPriceEditor
              key={spot.id}
              spot={spot}
              onSaved={async () => {
                setMessage("Spot updated.");
                await refresh();
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-medium tracking-[-0.03em]">Machine tiers</h2>
          <button
            type="button"
            className="btn-secondary h-9 text-[13px]"
            onClick={async () => {
              await fetch("/api/admin/tiers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
              });
              setMessage("Tiers reloaded from config/machine-tiers.ts.");
              await refresh();
            }}
          >
            Reload defaults from config
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {data.tiers.map((tier) => (
            <TierEditor
              key={tier.id}
              tier={tier}
              onSaved={async () => {
                setMessage("Tier updated.");
                await refresh();
              }}
            />
          ))}
        </div>
      </section>

      <SettingsEditor
        settings={data.settings}
        onSaved={async () => {
          setMessage("Settings saved.");
          await refresh();
        }}
      />

      <section className="mt-14">
        <h2 className="text-[18px] font-medium tracking-[-0.03em]">Recent webhooks</h2>
        {data.recentWebhooks.length === 0 ? (
          <p className="mt-3 text-[13px] text-mute">None processed yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-[12px] text-mute">
            {data.recentWebhooks.map((hook) => (
              <li key={hook.event_id} className="flex justify-between gap-4 border-b border-line py-2">
                <span className="truncate font-mono">{hook.event_id}</span>
                <span>{hook.processed_at}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-mute">{label}</dt>
      <dd className="mt-1 text-[22px] font-medium tracking-[-0.04em] tabular-nums">{value}</dd>
    </div>
  );
}

function SponsorRowEditor({
  sponsor,
  onSaved,
}: {
  sponsor: SponsorRow;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(sponsor.name);
  const [company, setCompany] = useState(sponsor.company);
  const [website, setWebsite] = useState(sponsor.website);
  const [logoUrl, setLogoUrl] = useState(sponsor.logo_url.startsWith("data:") ? "" : sponsor.logo_url);
  const [message, setMessage] = useState(sponsor.message);
  const [saving, setSaving] = useState(false);

  async function save(extra: Record<string, unknown> = {}) {
    setSaving(true);
    await fetch(`/api/admin/sponsors/${sponsor.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, company, website, logoUrl, message, ...extra }),
    });
    await onSaved();
    setSaving(false);
  }

  return (
    <tr className="border-b border-line align-top">
      <td className="py-3 pr-4">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="field mt-1"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
        />
      </td>
      <td className="py-3 pr-4 tabular-nums">{formatUsd(sponsor.amount)}</td>
      <td className="py-3 pr-4">{sponsor.status}</td>
      <td className="py-3 pr-4">{sponsor.is_visible ? "yes" : "no"}</td>
      <td className="py-3 pr-4">
        <input className="field" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <input
          className="field mt-1"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="Logo URL"
        />
        <input
          className="field mt-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
        />
      </td>
      <td className="py-3">
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-secondary h-8 text-[12px]" disabled={saving} onClick={() => save()}>
            Save
          </button>
          <button
            type="button"
            className="btn-secondary h-8 text-[12px]"
            disabled={saving}
            onClick={() => save({ isVisible: !sponsor.is_visible })}
          >
            {sponsor.is_visible ? "Hide" : "Show"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function TierEditor({
  tier,
  onSaved,
}: {
  tier: MachineTier;
  onSaved: () => Promise<void>;
}) {
  const [amountRequired, setAmountRequired] = useState(String(tier.amountRequired));
  const [chip, setChip] = useState(tier.chip);
  const [memory, setMemory] = useState(tier.memory);
  const [storage, setStorage] = useState(tier.storage);
  const [machineName, setMachineName] = useState(tier.machineName);
  const [description, setDescription] = useState(tier.description);

  return (
    <form
      className="grid gap-2 rounded-xl border border-line p-4 sm:grid-cols-6"
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch("/api/admin/tiers", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: tier.id,
            amountRequired: Number(amountRequired),
            chip,
            memory,
            storage,
            machineName,
            description,
          }),
        });
        await onSaved();
      }}
    >
      <input className="field" value={machineName} onChange={(e) => setMachineName(e.target.value)} />
      <input className="field" value={chip} onChange={(e) => setChip(e.target.value)} />
      <input className="field" value={memory} onChange={(e) => setMemory(e.target.value)} />
      <input className="field" value={storage} onChange={(e) => setStorage(e.target.value)} />
      <input
        className="field"
        value={amountRequired}
        onChange={(e) => setAmountRequired(e.target.value)}
      />
      <button type="submit" className="btn-secondary h-10 text-[12px]">
        Save
      </button>
      <textarea
        className="field sm:col-span-6"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </form>
  );
}

function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: SiteSettings;
  onSaved: () => Promise<void>;
}) {
  const [minSponsorAmount, setMin] = useState(String(settings.minSponsorAmount));
  const [bidIncrement, setIncrement] = useState(String(settings.bidIncrement));
  const [presets, setPresets] = useState(settings.presetAmounts.join(", "));
  const [xFollowing, setX] = useState(nullable(settings.socialProof.xFollowing));
  const [linkedInFollowing, setLi] = useState(
    nullable(settings.socialProof.linkedInFollowing),
  );
  const [monthlyImpressions, setImp] = useState(
    nullable(settings.socialProof.monthlyImpressions),
  );
  const [productsLaunched, setProducts] = useState(
    nullable(settings.socialProof.productsLaunched),
  );
  const [past, setPast] = useState(settings.socialProof.pastSponsorshipResults ?? "");

  return (
    <section className="mt-14">
      <h2 className="text-[18px] font-medium tracking-[-0.03em]">Site settings</h2>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await fetch("/api/admin/settings", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              minSponsorAmount: Number(minSponsorAmount),
              bidIncrement: Number(bidIncrement),
              presetAmounts: presets
                .split(",")
                .map((item) => Number(item.trim()))
                .filter((n) => Number.isFinite(n) && n > 0),
              socialProof: {
                xFollowing: parseNullable(xFollowing),
                linkedInFollowing: parseNullable(linkedInFollowing),
                monthlyImpressions: parseNullable(monthlyImpressions),
                productsLaunched: parseNullable(productsLaunched),
                pastSponsorshipResults: past.trim() || null,
              },
            }),
          });
          await onSaved();
        }}
      >
        <label className="text-[12px] text-mute">
          Minimum amount
          <input className="field mt-1" value={minSponsorAmount} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          Outbid increment
          <input className="field mt-1" value={bidIncrement} onChange={(e) => setIncrement(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          Preset amounts
          <input className="field mt-1" value={presets} onChange={(e) => setPresets(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          X following
          <input className="field mt-1" value={xFollowing} onChange={(e) => setX(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          LinkedIn following
          <input className="field mt-1" value={linkedInFollowing} onChange={(e) => setLi(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          Monthly impressions
          <input className="field mt-1" value={monthlyImpressions} onChange={(e) => setImp(e.target.value)} />
        </label>
        <label className="text-[12px] text-mute">
          Products launched
          <input className="field mt-1" value={productsLaunched} onChange={(e) => setProducts(e.target.value)} />
        </label>
        <label className="sm:col-span-2 text-[12px] text-mute">
          Past sponsorship results
          <textarea className="field mt-1" value={past} onChange={(e) => setPast(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary justify-self-start">
          Save settings
        </button>
      </form>
    </section>
  );
}

function SpotPriceEditor({
  spot,
  onSaved,
}: {
  spot: PublicSpot;
  onSaved: () => Promise<void>;
}) {
  const [price, setPrice] = useState(String(spot.basePrice));
  return (
    <form
      className="grid grid-cols-[1fr_120px_80px] items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch("/api/admin/spots", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: spot.id, basePrice: Number(price) }),
        });
        await onSaved();
      }}
    >
      <p className="text-[13px]">
        {spot.number}. {spot.name}
        {spot.occupant ? (
          <span className="ml-2 text-mute">held by {spot.occupant.displayName}</span>
        ) : null}
      </p>
      <input className="field" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button type="submit" className="btn-secondary h-10 text-[12px]">
        Save
      </button>
    </form>
  );
}

function nullable(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNullable(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
