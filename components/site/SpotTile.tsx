"use client";

import type { CSSProperties } from "react";
import { formatClicks, formatUsd } from "@/lib/format";
import type { PublicSpot } from "@/lib/types";
import { useSponsor } from "@/components/site/SponsorProvider";
import { SiteLogo } from "@/components/site/SiteLogo";

export function SpotClicks({ count }: { count: number }) {
  return (
    <span className="spot-sticker-clicks" aria-label={formatClicks(count)}>
      <svg
        className="spot-sticker-cursor"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 14a8 8 0 0 1-8 8" />
        <path d="M18 11v-1a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
        <path d="M14 10V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1" />
        <path d="M10 9.5V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v10" />
        <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
      {count}
    </span>
  );
}

export function SpotTile({
  spot,
  className = "spot-sticker",
  style,
}: {
  spot: PublicSpot;
  className?: string;
  style?: CSSProperties;
}) {
  const { openSponsor, recordClick, clicksFor } = useSponsor();
  const clicks = clicksFor(spot);

  if (!spot.occupant) {
    return (
      <button
        type="button"
        className={`${className} spot-size-${spot.size.toLowerCase()}`}
        data-taken="false"
        data-held={spot.held ? "true" : "false"}
        data-size={spot.size}
        style={style}
        onClick={() => openSponsor(spot.id)}
        aria-label={`${spot.name}, ${formatUsd(spot.nextPrice)}`}
      >
        <span className="spot-sticker-empty">
          <span className="spot-sticker-price">
            {spot.held ? "Held" : formatUsd(spot.nextPrice)}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={`${className} spot-size-${spot.size.toLowerCase()}`}
      data-taken="true"
      data-held={spot.held ? "true" : "false"}
      data-size={spot.size}
      style={style}
    >
      <SiteLogo
        name={spot.occupant.displayName}
        siteUrl={spot.occupant.website}
        src={spot.occupant.logoUrl}
        className="spot-sticker-logo"
      />
      <SpotClicks count={clicks} />
      <div className="spot-actions">
        {spot.occupant.website ? (
          <a
            className="spot-action spot-action-visit"
            href={spot.occupant.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordClick(spot.id)}
          >
            Visit
          </a>
        ) : null}
        <button
          type="button"
          className="spot-action spot-action-take"
          disabled={spot.held}
          onClick={() => openSponsor(spot.id)}
        >
          {spot.held ? "Held" : "Take over"}
          {!spot.held ? (
            <span className="spot-action-price">{formatUsd(spot.nextPrice)}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
