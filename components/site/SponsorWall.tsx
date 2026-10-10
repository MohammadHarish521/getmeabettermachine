"use client";

import { useMemo, useState } from "react";
import { formatUsd, timeAgo } from "@/lib/format";
import type { PublicSponsor } from "@/lib/types";
import { useSponsor } from "@/components/site/SponsorProvider";
import { SiteLogo } from "@/components/site/SiteLogo";

type Filter = "top" | "latest" | "all";

export function SponsorWall({
  sponsors,
  stats,
}: {
  sponsors: PublicSponsor[];
  stats: {
    raised: number;
    count: number;
    largestAmount: number;
  };
}) {
  const { openSponsor } = useSponsor();
  const [filter, setFilter] = useState<Filter>("latest");

  const visible = useMemo(() => {
    const copy = [...sponsors];
    if (filter === "top") {
      copy.sort((a, b) => b.amount - a.amount || b.createdAt.localeCompare(a.createdAt));
    } else {
      copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    copy.sort((a, b) => Number(b.isFounder) - Number(a.isFounder));
    return copy;
  }, [sponsors, filter]);

  return (
    <section id="sponsors" className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <p className="eyebrow">The wall</p>
      <h2 className="section-title mx-auto mt-3 max-w-[16ch]">
        The people upgrading this Mac
      </h2>

      <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px]">
        <span className="stat-chip">
          <strong>{formatUsd(stats.raised)}</strong> raised
        </span>
        <span className="stat-chip">
          <strong>{stats.count}</strong>{" "}
          {stats.count === 1 ? "sponsor" : "sponsors"}
        </span>
        <span className="stat-chip">
          <strong>
            {stats.largestAmount ? formatUsd(stats.largestAmount) : "—"}
          </strong>{" "}
          largest sponsor
        </span>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="segmented" role="tablist" aria-label="Sponsor list">
          {(
            [
              ["latest", "Latest"],
              ["top", "Top sponsors"],
              ["all", "All"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className="segmented-btn"
              data-active={filter === id ? "true" : "false"}
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md">
          <p className="text-[15px] text-mute">
            Be the first name on this machine. The wall stays empty until a
            payment actually clears.
          </p>
          <button type="button" className="btn-primary mt-5" onClick={() => openSponsor()}>
            Pick a spot
          </button>
        </div>
      ) : (
        <ul className="mt-8 flex flex-wrap justify-center gap-3 text-left">
          {visible.map((sponsor) => (
            <li
              key={sponsor.id}
              className={
                sponsor.isFounder
                  ? "w-full"
                  : "w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
              }
            >
              <SponsorCard sponsor={sponsor} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SponsorCard({ sponsor }: { sponsor: PublicSponsor }) {
  const prominent = sponsor.isFounder || sponsor.amount >= 100;
  const inner = (
    <>
      <div className="flex items-start gap-3">
        <SiteLogo
          name={sponsor.displayName}
          siteUrl={sponsor.website}
          src={sponsor.logoUrl}
          className="h-10 w-10 rounded-lg bg-white object-contain p-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-medium tracking-[-0.02em]">
              {sponsor.displayName}
            </p>
            {sponsor.isFounder ? (
              <span className="badge badge-status tabular-nums">
                Founder · {formatUsd(sponsor.amount)}
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-mute tabular-nums">
            {sponsor.isFounder
              ? "Starting the ladder"
              : `${formatUsd(sponsor.amount)}${sponsor.spotName ? ` · ${sponsor.spotName}` : ""}`}
            {" · "}
            {timeAgo(sponsor.createdAt)}
          </p>
        </div>
      </div>
      {sponsor.message ? (
        <p className="mt-3 text-[13px] leading-5 text-mute">{sponsor.message}</p>
      ) : null}
    </>
  );

  const className = `block rounded-2xl border p-4 transition-all duration-200 ${
    sponsor.isFounder
      ? "border-blue/25 bg-blue-soft"
      : prominent
        ? "border-line-strong bg-elevated/80 hover:border-line-strong/80 hover:shadow-sm"
        : "border-line bg-transparent hover:border-line-strong hover:shadow-sm"
  }`;

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}
