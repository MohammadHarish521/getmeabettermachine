"use client";

import { useEffect, useState } from "react";
import { SponsorRail, SpotStage } from "@/components/site/SpotStage";
import { LAST_YEAR_ON_X } from "@/components/site/SocialProof";
import { MACHINE_TIERS } from "@/config/machine-tiers";
import { markerPosition } from "@/lib/funding";
import { formatUsd } from "@/lib/format";
import type { DataFastStats } from "@/lib/datafast-stats";
import type { FundingState, PublicSponsor, PublicSpot } from "@/lib/types";

export function Hero({
  funding,
  spots,
  founder,
  clientRaised = 0,
  followers,
  stats,
}: {
  funding: FundingState;
  spots: PublicSpot[];
  founder: PublicSponsor | null;
  clientRaised?: number;
  followers: string | null;
  stats: DataFastStats | null;
}) {
  const last = funding.tiers.at(-1);
  const goal = last?.amountRequired ?? 1;
  const scale = Math.max(goal, funding.raised, 1);
  const progress = Math.min(100, Math.max(0, (funding.raised / scale) * 100));
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFill(progress);
      return;
    }
    const frame = window.requestAnimationFrame(() => setFill(progress));
    return () => window.cancelAnimationFrame(frame);
  }, [progress]);

  const leftSeats = spots
    .filter((spot) => spot.surface === "seat" && spot.gridCol === 1)
    .sort((a, b) => a.gridRow - b.gridRow);
  const rightSeats = spots
    .filter((spot) => spot.surface === "seat" && spot.gridCol === 2)
    .sort((a, b) => a.gridRow - b.gridRow);

  const status = funding.next
    ? `${formatUsd(funding.remaining)} to ${funding.next.shortLabel}`
    : funding.surplus > 0
      ? `+${formatUsd(funding.surplus)} more than needed`
      : "Top config funded";

  return (
    <section className="hero-section mx-auto flex max-w-[1120px] flex-col items-center px-5 pt-10 pb-10 text-center sm:px-6">
      <div className="hero-proof mb-5 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-mute">
        {stats ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full bg-green" aria-hidden="true" />
              <span className="font-semibold text-green tabular-nums">
                {formatCount(stats.live)}
              </span>
              online now
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-semibold text-ink tabular-nums">
                {formatCount(stats.visitors)}
              </span>
              visitors
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-semibold text-ink tabular-nums">
                {formatCount(stats.views)}
              </span>
              views
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-line sm:block" />
          </>
        ) : null}
        <span className="inline-flex items-baseline gap-1.5">
          <span className="font-semibold text-ink tabular-nums">{LAST_YEAR_ON_X[0]?.value}</span>
          impressions last year on X
        </span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="font-semibold text-ink tabular-nums">{LAST_YEAR_ON_X[1]?.value}</span>
          engagements
        </span>
        {followers ? (
          <span className="inline-flex items-baseline gap-1.5">
            <span className="font-semibold text-ink tabular-nums">{followers}</span>
            followers
          </span>
        ) : null}
      </div>
      <div className="hero-heading">
        {leftSeats.length ? (
          <div className="hero-heading-side">
            <SponsorRail seats={leftSeats} />
          </div>
        ) : null}
        <div className="hero-heading-copy">
          <h1 className="display mx-auto max-w-[18ch]">Help me build on a better Mac.</h1>
          <p className="hero-lede mx-auto mt-3 max-w-lg text-[17px] leading-relaxed text-mute">
            Brands don’t donate. They take a numbered sticker on the computer I’ll
            ship from.
          </p>
          <div className="hero-funding mx-auto mt-4 w-full">
            <div className="flex items-baseline justify-between gap-4">
              <p className="tabular-nums">
                <span className="text-2xl font-semibold text-green">{funding.copy.raisedLabel}</span>
                <span className="ml-1.5 text-sm text-mute">raised</span>
              </p>
              <p className="text-right text-sm text-mute">{status}</p>
            </div>
            <div className="goal-meter mt-3">
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${fill}%` }} />
              </div>
              {funding.tiers.map((tier, index) => {
                const extra = MACHINE_TIERS.find((item) => item.id === tier.id);
                const unlocked = funding.raised >= tier.amountRequired;
                const edge =
                  index === 0 ? "start" : index === funding.tiers.length - 1 ? "end" : "mid";
                const left = markerPosition(tier, scale);
                const previous =
                  index > 0 ? markerPosition(funding.tiers[index - 1], scale) : -100;
                const macbook = tier.machineName.startsWith("MacBook");
                const lifted = macbook && left - previous < 2;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    className="goal-point"
                    data-unlocked={unlocked ? "true" : "false"}
                    data-machine={macbook ? "macbook" : "mini"}
                    data-edge={edge}
                    data-stacked={lifted ? "true" : "false"}
                    style={{ left: `${left}%`, marginTop: lifted ? -13 : 0 }}
                    aria-label={`${tier.shortLabel}, ${formatUsd(tier.amountRequired)}${
                      extra ? `, ${formatInr(extra.inrPrice)} on ${extra.priceSource}` : ""
                    }`}
                  >
                    <span className="goal-dot" />
                    <span className="goal-tip" role="tooltip">
                      <span className="goal-tip-label">{tier.machineName}</span>
                      <span className="goal-tip-spec">
                        {tier.chip} · {tier.memory} · {tier.storage.replace(/\s+SSD$/i, "")}
                      </span>
                      <span className="goal-tip-price">{formatUsd(tier.amountRequired)}</span>
                      {extra ? (
                        <span className="goal-tip-source">
                          {formatInr(extra.inrPrice)} · {extra.priceSource}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              {funding.surplus > 0 ? (
                <span className="goal-surplus">+{formatUsd(funding.surplus)} more</span>
              ) : null}
            </div>
            {founder ? (
              <p className="mt-3 text-[13px] text-mute">
                Including {formatUsd(founder.amount)} I put in to start.
                {clientRaised > 0 ? ` ${formatUsd(clientRaised)} raised from clients.` : ""}{" "}
                Mini prices use Flipkart BBD where a listing is live. MacBook prices are Apple
                India.
              </p>
            ) : null}
          </div>
        </div>
        {rightSeats.length ? (
          <div className="hero-heading-side">
            <SponsorRail seats={rightSeats} />
          </div>
        ) : null}
      </div>

      <div className="hero-machine mt-5 w-full">
        <SpotStage spots={spots} />
      </div>
    </section>
  );
}

function formatCount(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
