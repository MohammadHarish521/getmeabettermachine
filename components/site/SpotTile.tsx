"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
        disabled={spot.held}
        aria-label={
          spot.held
            ? `${spot.name}, someone is checking out`
            : `${spot.name}, ${formatUsd(spot.nextPrice)}`
        }
      >
        <span className="spot-sticker-empty">
          <span className="spot-sticker-price">
            {spot.held ? "Checking out" : formatUsd(spot.nextPrice)}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`${className} spot-size-${spot.size.toLowerCase()}`}
      data-taken="true"
      data-held={spot.held ? "true" : "false"}
      data-size={spot.size}
      data-open={open ? "true" : "false"}
      data-popover={
        spot.surface === "front" || spot.surface === "back" || spot.gridRow >= 2
          ? "above"
          : "below"
      }
      style={style}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest(".spot-popover")) return;
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        setOpen((value) => !value);
      }}
    >
      <div className="spot-sticker-face">
        <SiteLogo
          name={spot.occupant.displayName}
          siteUrl={spot.occupant.website}
          src={spot.occupant.logoUrl}
          className="spot-sticker-logo"
        />
        <SpotClicks count={clicks} />
        {spot.held ? <span className="spot-hold-flag">Checking out</span> : null}
      </div>
      <div className="spot-popover" role="group" aria-label={spot.name}>
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
          {spot.held ? "Checking out" : "Take over"}
          {!spot.held ? (
            <span className="spot-action-price">{formatUsd(spot.nextPrice)}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
