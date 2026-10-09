"use client";

import { useEffect, useState } from "react";
import { SpotStage } from "@/components/site/SpotStage";
import { LAST_YEAR_ON_X } from "@/components/site/SocialProof";
import { formatUsd } from "@/lib/format";
import type { DataFastStats } from "@/lib/datafast-stats";
import type { FundingState, PublicSponsor, PublicSpot } from "@/lib/types";

export function Hero({
  funding,
  spots,
  founder,
  followers,
  stats,
}: {
  funding: FundingState;
  spots: PublicSpot[];
  founder: PublicSponsor | null;
  followers: string | null;
  stats: DataFastStats | null;
}) {
  const goal = funding.next?.amountRequired ?? funding.tiers.at(-1)?.amountRequired ?? 1;
  const progress = Math.min(100, Math.max(0, (funding.raised / goal) * 100));
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

  const status = funding.next
    ? `${formatUsd(funding.remaining)} to ${funding.next.shortLabel}`
    : "Ladder complete";

  return (
    <section className="mx-auto flex max-w-[1120px] flex-col items-center px-5 pt-14 pb-16 text-center sm:px-6 md:pt-16">
      <div className="mb-8 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-mute">
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
      <h1 className="display mx-auto max-w-[18ch]">Help me build on a better Mac.</h1>
      <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-mute">
        Brands don’t donate. They take a numbered sticker on the computer I’ll
        ship from.
      </p>

      <div className="mx-auto mt-8 w-full max-w-md">
        <div className="flex items-baseline justify-between gap-4">
          <p className="tabular-nums">
            <span className="text-2xl font-semibold text-green">{funding.copy.raisedLabel}</span>
            <span className="ml-1.5 text-sm text-mute">raised</span>
          </p>
          <p className="text-right text-sm text-mute">{status}</p>
        </div>
        <div className="goal-track mt-2" aria-hidden="true">
          <div className="goal-fill" style={{ width: `${fill}%` }} />
        </div>
        {founder ? (
          <p className="mt-2 text-[13px] text-mute">
            Including {formatUsd(founder.amount)} I put in to start.
          </p>
        ) : null}
      </div>

      <div className="mt-8 w-full">
        <SpotStage spots={spots} />
      </div>
    </section>
  );
}

function formatCount(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}
