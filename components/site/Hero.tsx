"use client";

import { useEffect, useState } from "react";
import { SpotStage } from "@/components/site/SpotStage";
import { LAST_YEAR_ON_X } from "@/components/site/SocialProof";
import { formatUsd } from "@/lib/format";
import type { FundingState, PublicSponsor, PublicSpot } from "@/lib/types";

export function Hero({
  funding,
  spots,
  founder,
  followers,
}: {
  funding: FundingState;
  spots: PublicSpot[];
  founder: PublicSponsor | null;
  followers: string | null;
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
      <p className="mb-6 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 text-[14px] text-mute">
        <span>
          <span className="mr-1.5 text-[32px] font-semibold tracking-[-0.04em] text-green tabular-nums">
            {LAST_YEAR_ON_X[0]?.value}
          </span>
          impressions
        </span>
        <span>
          <span className="mr-1.5 font-semibold text-ink tabular-nums">
            {LAST_YEAR_ON_X[1]?.value}
          </span>
          engagements
        </span>
        <span className="text-[12px] tracking-[0.04em] uppercase">Last year on X</span>
        {followers ? (
          <span>
            <span className="mr-1.5 font-semibold text-ink tabular-nums">{followers}</span>
            followers
          </span>
        ) : null}
      </p>
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
