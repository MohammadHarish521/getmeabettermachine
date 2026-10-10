"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { PublicSpot } from "@/lib/types";
import { SpotBoard } from "@/components/site/SpotBoard";
import { SpotTile } from "@/components/site/SpotTile";

type StageView = "machine" | "inventory";

function byGrid(a: PublicSpot, b: PublicSpot) {
  return a.gridRow - b.gridRow || a.gridCol - b.gridCol;
}

function tileStyle(spot: PublicSpot): CSSProperties {
  return {
    gridColumn: `${spot.gridCol} / span ${spot.gridSpan}`,
    gridRow: `${spot.gridRow} / span ${spot.gridRowSpan}`,
  };
}

export function SpotStage({ spots }: { spots: PublicSpot[] }) {
  const [view, setView] = useState<StageView>("machine");

  const top = spots
    .filter((spot) => spot.surface === "stage")
    .sort((a, b) => a.number - b.number);
  const front = spots.filter((spot) => spot.surface === "front").sort(byGrid);
  const back = spots.filter((spot) => spot.surface === "back").sort(byGrid);
  const adapter = spots.filter((spot) => spot.surface === "adapter").sort(byGrid);
  const mouse = spots.filter((spot) => spot.surface === "mouse").sort(byGrid);

  return (
    <div id="spots">
      <div className="mb-4 flex flex-col items-center">
        <div className="segmented" role="tablist" aria-label="Spot view">
          <button
            type="button"
            role="tab"
            className="segmented-btn"
            data-active={view === "machine" ? "true" : "false"}
            aria-selected={view === "machine"}
            onClick={() => setView("machine")}
          >
            The machine
          </button>
          <button
            type="button"
            role="tab"
            className="segmented-btn"
            data-active={view === "inventory" ? "true" : "false"}
            aria-selected={view === "inventory"}
            onClick={() => setView("inventory")}
          >
            The inventory
          </button>
        </div>
        <p className="segmented-caption">
          {view === "inventory"
            ? "Every spot, who holds it, and what it costs to take over."
            : "Tap any sticker to take that spot. Taken seats can be claimed for 1.5×."}
        </p>
      </div>

      {view === "inventory" ? <SpotBoard spots={spots} bare /> : null}

      <div hidden={view !== "machine"}>
        <div className="desk-stage">
          <div className="desk-rail">
            <SideFace label="Front" src="/mac-front.jpg" alt="Mac mini front" spots={front} />
            {adapter.length ? (
              <Accessory
                label="Power adapter"
                src="/power-adapter.jpg"
                alt="70W USB-C power adapter"
                wrapClass="device-adapter-photo"
                spots={adapter}
              />
            ) : null}
          </div>

          <div className="desk-center">
            <p className="accessory-label">Top</p>
            <div className="mac-photo-wrap">
              <div className="mac-photo-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mac-studio.jpg" alt="Mac mini top" className="mac-photo" />
                <div className="mac-face">
                  {top.map((spot) => (
                    <SpotTile key={spot.id} spot={spot} style={tileStyle(spot)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="desk-rail">
            <SideFace label="Back" src="/mac-back.jpg" alt="Mac mini back" spots={back} />
            {mouse.length ? (
              <Accessory
                label="Magic Mouse"
                src="/magic-mouse.jpg"
                alt="Magic Mouse"
                wrapClass="device-mouse-photo"
                spots={mouse}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SideFace({
  label,
  src,
  alt,
  spots,
}: {
  label: string;
  src: string;
  alt: string;
  spots: PublicSpot[];
}) {
  return (
    <div className="desk-face-block">
      <p className="accessory-label">{label}</p>
      <div className="mac-side-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mac-side-photo" />
        <div className="mac-side-face">
          {spots.map((spot) => (
            <SpotTile key={spot.id} spot={spot} style={tileStyle(spot)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Accessory({
  label,
  src,
  alt,
  wrapClass,
  spots,
}: {
  label: string;
  src: string;
  alt: string;
  wrapClass: string;
  spots: PublicSpot[];
}) {
  return (
    <div className="desk-accessory">
      <p className="accessory-label">{label}</p>
      <div className={wrapClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
        <div className="accessory-face">
          {spots.map((spot) => (
            <SpotTile
              key={spot.id}
              spot={spot}
              className="spot-sticker accessory-sticker"
              style={tileStyle(spot)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
