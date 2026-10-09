"use client";

import { useEffect, useState } from "react";
import { markerPosition } from "@/lib/funding";
import { formatUsd } from "@/lib/format";
import type { FundingState, PublicSponsor } from "@/lib/types";

export function FundingPanel({
  funding,
  founder,
}: {
  funding: FundingState;
  founder: PublicSponsor | null;
}) {
  const { copy, overallPercent, tiers, raised, next } = funding;
  const last = tiers.at(-1);
  const lastAmount = last?.amountRequired ?? 1;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFill(overallPercent);
      return;
    }
    const frame = window.requestAnimationFrame(() => setFill(overallPercent));
    return () => window.cancelAnimationFrame(frame);
  }, [overallPercent]);

  return (
    <section aria-label="Mac funding" className="bg-charcoal">
      <div className="flex flex-col items-center gap-8 p-5 text-center sm:p-7 lg:p-8">
        <div>
          <p className="tabular-nums">
            <span className="text-2xl font-semibold text-green sm:text-[2rem]">
              {copy.raisedLabel}
            </span>
            <span className="ml-2 text-sm font-normal text-mute">
              {copy.milestoneLabel}
            </span>
          </p>
          {founder ? (
            <p className="mt-3 text-sm text-mute">
              Including {formatUsd(founder.amount)} I put in to start.
            </p>
          ) : null}
        </div>
        <div className="grid w-full gap-8 sm:grid-cols-2">
          <SpecBlock
            eyebrow={copy.currentEyebrow}
            title={copy.currentTitle}
            specs={copy.currentSpecs}
            active
          />
          <SpecBlock
            eyebrow={copy.nextEyebrow}
            title={copy.nextTitle}
            specs={
              copy.nextSpecs.length > 0
                ? copy.nextSpecs
                : [{ label: "Status", value: "Complete" }]
            }
            active={false}
          />
        </div>
      </div>

      <div className="px-5 py-6 text-center sm:px-7 lg:px-8">
        <p className="text-xl font-semibold tracking-[-0.015em] text-ink">
          {copy.meterHeadline}
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-mute">{copy.meterSub}</p>

        <div className="mt-6 hidden sm:block">
          <div className="relative mb-10 h-10">
            {tiers.map((tier) => {
              const left = markerPosition(tier, lastAmount);
              const unlocked = raised >= tier.amountRequired;
              const isNext = next?.id === tier.id;
              return (
                <div
                  key={tier.id}
                  className="absolute top-0 -translate-x-1/2 text-center"
                  style={{ left: `${left}%` }}
                >
                  <p
                    className={`text-[11px] font-medium tracking-[0.06em] uppercase ${
                      unlocked ? "text-blue" : isNext ? "text-ink" : "text-dim"
                    }`}
                  >
                    {tier.shortLabel}
                  </p>
                  <p className={`text-[11px] ${unlocked ? "text-mute" : "text-dim"}`}>
                    {tier.storage.replace(/\s+SSD$/i, "")}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${fill}%` }} />
            {tiers.map((tier) => (
              <span
                key={tier.id}
                className="meter-mark"
                style={{ left: `${markerPosition(tier, lastAmount)}%` }}
              />
            ))}
            <span className="meter-knob" style={{ left: `${fill}%` }} />
          </div>
        </div>

        <ol className="mt-6 space-y-0 text-left sm:hidden">
          {tiers.map((tier, index) => {
            const unlocked = raised >= tier.amountRequired;
            const isNext = next?.id === tier.id;
            return (
              <li key={tier.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      unlocked
                        ? "bg-blue"
                        : isNext
                          ? "bg-blue/40"
                          : "border border-line-strong bg-transparent"
                    }`}
                  />
                  {index < tiers.length - 1 ? (
                    <span
                      className={`w-px flex-1 ${unlocked ? "bg-blue/40" : "bg-line-strong"}`}
                    />
                  ) : null}
                </div>
                <div className={`pb-5 ${unlocked ? "text-ink" : "text-dim"}`}>
                  <p className="text-[13px] font-medium tracking-[-0.02em]">
                    {tier.chip} · {tier.memory} · {tier.storage}
                  </p>
                  <p className="text-[12px] text-mute">
                    {unlocked
                      ? "Unlocked"
                      : isNext
                        ? `${formatUsd(funding.remaining)} more`
                        : formatUsd(tier.amountRequired)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function SpecBlock({
  eyebrow,
  title,
  specs,
  active,
}: {
  eyebrow: string;
  title: string;
  specs: { label: string; value: string }[];
  active: boolean;
}) {
  return (
    <div className={active ? "text-ink" : "text-mute"}>
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-2 text-sm text-mute">{title}</p>
      <ul className="mt-3 space-y-0.5">
        {specs.map((spec) => (
          <li
            key={spec.label}
            className={`text-xl leading-tight font-semibold ${
              active ? "text-ink" : "text-silver"
            }`}
          >
            {spec.value}
            {spec.label === "Memory" && spec.value !== "—" ? (
              <span className="ml-1 text-[13px] font-normal tracking-normal text-mute">
                Memory
              </span>
            ) : null}
            {spec.label === "Storage" && spec.value !== "—" ? (
              <span className="ml-1 text-[13px] font-normal tracking-normal text-mute">
                SSD
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
