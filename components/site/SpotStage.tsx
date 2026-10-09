"use client";

import { formatUsd } from "@/lib/format";
import type { PublicSpot } from "@/lib/types";
import { useSponsor } from "@/components/site/SponsorProvider";
import { SiteLogo } from "@/components/site/SiteLogo";

export function SpotStage({ spots }: { spots: PublicSpot[] }) {
  const { openSponsor } = useSponsor();
  const lid = spots
    .filter((spot) => spot.surface === "stage")
    .sort((a, b) => a.number - b.number);

  return (
    <div id="spots">
      <div className="mac-photo-wrap">
        <div className="mac-photo-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mac-studio.jpg"
          alt="Mac mini"
          className="mac-photo"
        />
        <div className="mac-face">
          {lid.map((spot) => {
            const place = {
              gridColumn: `${spot.gridCol} / span ${spot.gridSpan}`,
              gridRow: spot.gridRow,
            };
            if (!spot.occupant) {
              return (
                <button
                  key={spot.id}
                  type="button"
                  className="spot-sticker"
                  data-taken="false"
                  data-held={spot.held ? "true" : "false"}
                  style={place}
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
                key={spot.id}
                className="spot-sticker"
                data-taken="true"
                data-held={spot.held ? "true" : "false"}
                style={place}
              >
                <SiteLogo
                  name={spot.occupant.displayName}
                  siteUrl={spot.occupant.website}
                  src={spot.occupant.logoUrl}
                  className="spot-sticker-logo"
                />
                <div className="spot-actions">
                  {spot.occupant.website ? (
                    <a
                      className="spot-action spot-action-visit"
                      href={spot.occupant.website}
                      target="_blank"
                      rel="noopener noreferrer"
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
          })}
        </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-mute">
        Tap a sticker to take that spot. Taken seats can be claimed for 1.5× the current price.
      </p>
    </div>
  );
}
