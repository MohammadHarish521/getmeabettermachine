import { FOUNDER_SPONSOR } from "@/config/site";
import { formatUsd } from "@/lib/format";

export function WhySection({ profileUrl }: { profileUrl: string }) {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Why I am doing this</p>
        <h2 className="section-title mt-3">Not charity. Sponsorship, in public.</h2>
        <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-mute">
          <p>I spend most of my day building.</p>
          <p>
            Web products, experiments, client work, design, content and
            increasingly native apps.
          </p>
          <p>
            My current Windows machine has done a ridiculous amount of work, but
            I now need a Mac for macOS and iOS development.
          </p>
          <p className="text-ink">So I thought: why not sell seats on it?</p>
          <p>
            Sponsors buy a numbered spot on the machine. They stay on this page
            and become part of whatever gets built next. The money upgrades the
            Mac. I’m already in for {formatUsd(FOUNDER_SPONSOR.amount)} — that’s the starting point.
          </p>
          <p>
            <a
              className="font-medium text-blue hover:underline"
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find me on X
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
