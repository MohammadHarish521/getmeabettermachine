"use client";

import { formatUsd } from "@/lib/format";
import type { PublicSpot } from "@/lib/types";
import { useSponsor } from "@/components/site/SponsorProvider";

export function SpotBoard({ spots }: { spots: PublicSpot[] }) {
  const { openSponsor } = useSponsor();

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

      <div className="mt-10 overflow-x-auto text-left">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="text-[13px] font-semibold tracking-[0.02em] text-mute uppercase">
            <tr className="border-b border-line">
              <th className="py-3 pr-3 font-medium">#</th>
              <th className="py-3 pr-3 font-medium">Spot</th>
              <th className="py-3 pr-3 font-medium">Size</th>
              <th className="py-3 pr-3 font-medium">Held by</th>
              <th className="py-3 pr-3 font-medium">Price</th>
              <th className="py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {spots.map((spot) => (
              <tr key={spot.id} className="border-b border-line">
                <td className="py-4 pr-3 tabular-nums text-mute">{spot.number}</td>
                <td className="py-4 pr-3">
                  <p className="font-medium tracking-[-0.02em]">{spot.name}</p>
                  <p className="mt-0.5 max-w-xs text-[12px] text-mute">{spot.description}</p>
                </td>
                <td className="py-4 pr-3 text-mute">{spot.size}</td>
                <td className="py-4 pr-3">
                  {spot.occupant ? (
                    spot.occupant.website ? (
                      <a
                        href={spot.occupant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
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
                    <span>
                      {formatUsd(spot.currentAmount)}
                      <span className="ml-1 text-mute">from {formatUsd(spot.nextPrice)}</span>
                    </span>
                  ) : (
                    formatUsd(spot.nextPrice)
                  )}
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    className="btn-secondary h-9 px-3 text-[12px]"
                    onClick={() => openSponsor(spot.id)}
                  >
                    {spot.held ? "Held" : spot.occupant ? "Take over" : "Take spot"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
