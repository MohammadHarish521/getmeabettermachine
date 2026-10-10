import type { SiteSettings } from "@/config/site";
import type { XProfile } from "@/lib/x-profile";

/** X analytics for the past year, as shown in the account dashboard. */
export const LAST_YEAR_ON_X = [
  { label: "Impressions", value: "21M" },
  { label: "Engagements", value: "487.5K" },
  { label: "Profile visits", value: "89.7K" },
  { label: "Likes", value: "279.4K" },
  { label: "Bookmarks", value: "68.3K" },
  { label: "Reposts", value: "14.5K" },
  { label: "Replies", value: "29.4K" },
  { label: "Shares", value: "6.1K" },
];

export function SocialProof({
  settings,
  profile,
}: {
  settings: SiteSettings;
  profile: XProfile;
}) {
  const followers = numberItem("Followers on X", settings.socialProof.xFollowing);
  const results = settings.socialProof.pastSponsorshipResults?.trim() ?? "";
  const stats = [
    ...(followers ? [followers] : []),
    ...LAST_YEAR_ON_X,
  ];

  return (
    <section id="who" className="mx-auto max-w-[1120px] px-5 py-20 sm:px-6 lg:py-28">
      <div className="text-center">
        <p className="eyebrow">A little context</p>
        <h2 className="section-title mt-3">Who is building this</h2>
      </div>

      <div className="who-split mt-12">
        <div className="founder-bio">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              width={72}
              height={72}
              className="founder-bio-avatar"
            />
          ) : (
            <span className="founder-bio-avatar founder-bio-fallback" aria-hidden="true">
              {(profile.name || "H").slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="founder-bio-name">Hey, I&apos;m {profile.name}</h3>
            <p className="founder-bio-copy">
              I build in public — web products, experiments, client work, design, and
              now native apps. My Windows machine has done ridiculous work, but I need
              a Mac for macOS and iOS. So I&apos;m selling numbered seats on the computer
              I&apos;ll ship from.
            </p>
            {results ? (
              <p className="founder-bio-copy mt-3">{results}</p>
            ) : null}
            <p className="founder-bio-copy mt-3">
              Questions?{" "}
              <a
                className="text-link"
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Find me on X
              </a>.
            </p>
          </div>
        </div>

        <div>
          <p className="proof-kicker">Last year on X</p>
          <dl className="proof-grid">
            {stats.map((item) => (
              <div key={item.label} className="proof-stat">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function numberItem(label: string, value: number | null) {
  if (value === null || value === undefined) return null;
  return {
    label,
    value: new Intl.NumberFormat("en-US", { notation: "compact" }).format(value),
  };
}
