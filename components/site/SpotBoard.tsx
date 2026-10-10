"use client";

import { formatUsd } from "@/lib/format";
import { SURFACE_LABEL } from "@/config/spots";
import type { PublicSpot } from "@/lib/types";
import { useSponsor } from "@/components/site/SponsorProvider";
import { SpotClicks } from "@/components/site/SpotTile";

export function SpotBoard({
  spots,
  bare = false,
}: {
  spots: PublicSpot[];
  bare?: boolean;
}) {
  const { openSponsor, recordClick, clicksFor } = useSponsor();

  const table = (
      <div className={`overflow-x-auto text-left ${bare ? "" : "mt-10"}`}>
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="text-[13px] font-semibold tracking-[0.02em] text-mute uppercase">
            <tr className="border-b border-line">
              <th className="py-3 pr-3 font-medium">#</th>
              <th className="py-3 pr-3 font-medium">Spot</th>
              <th className="py-3 pr-3 font-medium">Size</th>
              <th className="py-3 pr-3 font-medium">Held by</th>
              <th className="py-3 pr-3 font-medium">Price</th>
              <th className="py-3 pr-3 font-medium">Clicks</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {spots.map((spot) => (
              <tr key={spot.id} className="border-b border-line">
                <td className="py-4 pr-3">
                  <span className="spot-number">{spot.number}</span>
                </td>
                <td className="py-4 pr-3">
                  <p className="font-medium tracking-[-0.02em]">{spot.name}</p>
                  <p className="mt-0.5 max-w-xs text-[12px] text-mute">
                    {SURFACE_LABEL[spot.surface]} · {spot.description}
                  </p>
                </td>
                <td className="py-4 pr-3">
                  <span className="size-badge">
                    <span className="size-badge-label">{spot.size}</span>
                  </span>
                </td>
                <td className="py-4 pr-3">
                  {spot.occupant ? (
                    spot.occupant.website ? (
                      <a
                        href={spot.occupant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium link-external hover:text-blue"
                        onClick={() => recordClick(spot.id)}
                      >
                        {spot.occupant.displayName}
                      </a>
                    ) : (
                      <span className="font-medium">{spot.occupant.displayName}</span>
                    )
                  ) : (
                    <span className="text-dim">Open</span>
                  )}
                </td>
                <td className="py-4 pr-3 tabular-nums">
                  {spot.occupant ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{formatUsd(spot.currentAmount)}</span>
                      <span className="text-[12px] text-dim">from {formatUsd(spot.nextPrice)}</span>
                    </div>
                  ) : (
                    <span className="font-medium">{formatUsd(spot.nextPrice)}</span>
                  )}
                </td>
                <td className="py-4 pr-3">
                  {spot.occupant ? (
                    <SpotClicks count={clicksFor(spot)} />
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </td>
                <td className="py-4 pr-3">
                  {spot.occupant ? (
                    <span className="badge badge-sold">Taken</span>
                  ) : spot.held ? (
                    <span className="badge badge-status">Held</span>
                  ) : (
                    <span className="badge badge-category">Open</span>
                  )}
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    className={spot.held ? "btn-secondary" : "btn-ink"}
                    onClick={() => openSponsor(spot.id)}
                    disabled={spot.held}
                  >
                    {spot.held ? "Held" : spot.occupant ? "Take over" : "Take spot"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );

  if (bare) return table;

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 text-center sm:px-6">
      <p className="eyebrow">The inventory</p>
      <h2 className="section-title mx-auto mt-3 max-w-[18ch]">
        Pick a spot. That’s the product.
      </h2>
      <p className="lede mx-auto mt-4 max-w-xl">
        People don’t pay to be nice. They pay to sit on the machine I’ll build
        from. Every placement funds the next configuration.
      </p>
      {table}
    </section>
  );
}
