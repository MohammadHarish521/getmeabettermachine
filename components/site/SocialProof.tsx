import type { SiteSettings } from "@/config/site";

/** X analytics for the past year, as shown in the account dashboard. */
export const LAST_YEAR_ON_X = [
  { label: "Impressions", value: "21M" },
  { label: "Engagements", value: "487.5K" },
  { label: "Engagement rate", value: "2.3%" },
  { label: "Profile visits", value: "89.7K" },
  { label: "Likes", value: "279.4K" },
  { label: "Bookmarks", value: "68.3K" },
  { label: "Reposts", value: "14.5K" },
  { label: "Replies", value: "29.4K" },
  { label: "Shares", value: "6.1K" },
];

export function SocialProof({ settings }: { settings: SiteSettings }) {
  const followers = numberItem("Followers on X", settings.socialProof.xFollowing);
  const results = settings.socialProof.pastSponsorshipResults?.trim() ?? "";

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <p className="eyebrow">A little context</p>
      <h2 className="section-title mt-3">Who is building this</h2>
      <p className="mt-3 text-[13px] text-mute">Last year on X</p>
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {followers ? <Stat label={followers.label} value={followers.value} /> : null}
        {LAST_YEAR_ON_X.map((item) => (
          <Stat key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
      {results ? (
        <p className="mx-auto mt-8 max-w-xl text-[15px] leading-7 text-mute">{results}</p>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-mute">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-green">{value}</dd>
    </div>
  );
}

function numberItem(label: string, value: number | null) {
  if (value === null || value === undefined) return null;
  return {
    label,
    value: new Intl.NumberFormat("en-US", { notation: "compact" }).format(value),
  };
}
