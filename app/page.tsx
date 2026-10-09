import { SponsorProvider } from "@/components/site/SponsorProvider";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { SpotBoard } from "@/components/site/SpotBoard";
import { SponsorWall } from "@/components/site/SponsorWall";
import { UpgradeLadder } from "@/components/site/UpgradeLadder";
import { HowItWorks } from "@/components/site/HowItWorks";
import { WhySection } from "@/components/site/WhySection";
import { LiveActivity } from "@/components/site/LiveActivity";
import { SocialProof } from "@/components/site/SocialProof";
import { Footer } from "@/components/site/Footer";
import { getDataFastStats } from "@/lib/datafast-stats";
import { getHomeSnapshot } from "@/lib/queries";
import { getXProfile } from "@/lib/x-profile";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [data, profile, stats] = await Promise.all([
    getHomeSnapshot(),
    getXProfile(),
    getDataFastStats(),
  ]);

  return (
    <SponsorProvider spots={data.spots}>
      <Nav />
      <main>
        <Hero
          funding={data.funding}
          spots={data.spots}
          founder={data.sponsors.find((sponsor) => sponsor.isFounder) ?? null}
          followers={
            profile.followers
              ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(profile.followers)
              : null
          }
          stats={stats}
        />
        <SocialProof
          settings={{
            ...data.settings,
            socialProof: {
              ...data.settings.socialProof,
              xFollowing: profile.followers || data.settings.socialProof.xFollowing,
            },
          }}
        />
        <div className="hairline mx-auto max-w-[1120px]" />
        <SpotBoard spots={data.spots} />
        <div className="hairline mx-auto max-w-[1120px]" />
        <SponsorWall sponsors={data.sponsors} stats={data.stats} />
        <div className="hairline mx-auto max-w-[1120px]" />
        <UpgradeLadder funding={data.funding} />
        <div className="hairline mx-auto max-w-[1120px]" />
        <HowItWorks />
        <div className="hairline mx-auto max-w-[1120px]" />
        <WhySection profileUrl={profile.url} />
        <div className="hairline mx-auto max-w-[1120px]" />
        <LiveActivity items={data.activity} />
      </main>
      <Footer mockPayments={data.mockPayments} profile={profile} />
    </SponsorProvider>
  );
}
