"use client";

import { SaleCountdown } from "@/components/site/SaleCountdown";
import { useSponsor } from "@/components/site/SponsorProvider";
import { Wordmark } from "@/components/site/Wordmark";
import type { PublicSponsor } from "@/lib/types";

export function Nav({ navOccupant }: { navOccupant?: PublicSponsor | null }) {
  const { openSponsor } = useSponsor();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-3 px-5 sm:px-6">
        <Wordmark occupant={navOccupant} />
        <SaleCountdown />
        <nav className="flex items-center gap-5 text-[14px] text-mute">
          <a
            className="hidden link-external transition-colors hover:text-ink sm:inline"
            href="https://datafa.st/share/6ac91124290e46fc33aa8a35"
            target="_blank"
            rel="noreferrer"
          >
            Live stats
          </a>
          <a className="hidden link-internal transition-colors hover:text-ink sm:inline" href="#spots">
            Spots
          </a>
          <a className="hidden link-internal transition-colors hover:text-ink sm:inline" href="#how">
            How it works
          </a>
          <button type="button" className="btn-ink" onClick={() => openSponsor()}>
            Pick a spot
          </button>
        </nav>
      </div>
    </header>
  );
}
