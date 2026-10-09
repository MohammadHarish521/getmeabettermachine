"use client";

import { useSponsor } from "@/components/site/SponsorProvider";
import type { XProfile } from "@/lib/x-profile";

export function Footer({
  mockPayments,
  profile,
}: {
  mockPayments: boolean;
  profile: XProfile;
}) {
  const { openSponsor } = useSponsor();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-6 px-5 py-10 text-center sm:px-6">
        <div>
          <a
            className="inline-flex items-center gap-3"
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <span className="text-left">
              <span className="block text-[15px] font-semibold tracking-[-0.02em]">
                {profile.name}
              </span>
              <span className="block text-[14px] font-medium text-blue">
                @{profile.handle}
              </span>
            </span>
          </a>
          <p className="mx-auto mt-3 max-w-sm text-[14px] text-mute">
            The internet is upgrading the computer I build on.
          </p>
          {mockPayments ? (
            <p className="mt-3 text-[12px] text-dim">
              Test checkout is on. Dodo is not configured on this environment.
            </p>
          ) : (
            <p className="mt-3 text-[12px] text-dim">Payments by Dodo</p>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={() => openSponsor()}>
          Pick a spot
        </button>
      </div>
    </footer>
  );
}
