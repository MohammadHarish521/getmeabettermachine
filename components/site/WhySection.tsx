import { FOUNDER_SPONSOR } from "@/config/site";
import { formatUsd } from "@/lib/format";

export function WhySection({ profileUrl }: { profileUrl: string }) {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Why I am doing this</p>
        <h2 className="section-title mt-3">Not charity. Sponsorship, in public.</h2>
      </div>
      <div className="mx-auto mt-8 max-w-xl space-y-6 text-[17px] leading-relaxed text-mute">
        <p>
          I spend most of my day building web products, experiments, client work, design, 
          and increasingly native apps.
        </p>
        <p>
          My Windows machine has done ridiculous work, but I need a Mac now for macOS 
          and iOS development.
        </p>
        <div className="my-8 border-y border-line py-6 text-center">
          <p className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
            So I thought: why not sell seats on it?
          </p>
        </div>
        <p>
          Sponsors take a numbered spot. They stay on this page and become part of 
          whatever gets built next. The money upgrades the Mac.
        </p>
        <p className="text-[15px] text-mute">
          I'm already in for {formatUsd(FOUNDER_SPONSOR.amount)} — that's the starting point.
        </p>
      </div>
              <div className="mt-10 text-center">
                <a
                  className="btn-secondary inline-flex link-external"
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Follow on X
                </a>
              </div>
    </section>
  );
}
