"use client";

import type { PublicSponsor } from "@/lib/types";
import { SiteLogo } from "@/components/site/SiteLogo";

export function Wordmark({ occupant }: { occupant?: PublicSponsor | null }) {
  return (
    <a href="/" className="flex items-center gap-2.5" aria-label="Home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mac-mini-logo.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-md object-cover"
      />
      {occupant ? (
        <span className="ml-1 flex items-center gap-1.5 text-[12px] font-normal text-mute">
          <span className="text-dim">×</span>
          <SiteLogo
            name={occupant.displayName}
            siteUrl={occupant.website}
            src={occupant.logoUrl}
            className="h-5 w-5 rounded-md bg-white object-contain"
          />
          <span className="hidden sm:inline">{occupant.displayName}</span>
        </span>
      ) : null}
    </a>
  );
}
