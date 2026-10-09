import type { FundingState } from "@/lib/types";
import { formatUsd } from "@/lib/format";

export function UpgradeLadder({ funding }: { funding: FundingState }) {
  const { tiers, raised, next } = funding;

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <p className="eyebrow">The ladder</p>
      <h2 className="section-title mx-auto mt-3 max-w-[18ch]">
        Every sponsor makes the machine better.
      </h2>

      <ol className="mt-12 flex flex-col gap-0 lg:flex-row lg:items-stretch">
        {tiers.map((tier, index) => {
          const unlocked = raised >= tier.amountRequired;
          const isNext = next?.id === tier.id;
          return (
            <li key={tier.id} className="flex flex-1 items-stretch">
              <div
                className={`flex-1 border-t py-6 text-center lg:border-t-0 lg:border-l lg:px-5 lg:py-0 ${
                  unlocked
                    ? "border-silver/40"
                    : isNext
                      ? "border-line-strong"
                      : "border-line"
                } ${index === 0 ? "lg:border-l-0 lg:pl-0" : ""}`}
              >
                <p
                  className={`text-[11px] tracking-[0.08em] uppercase ${
                    unlocked ? "text-blue" : isNext ? "text-ink" : "text-dim"
                  }`}
                >
                  {unlocked ? "Unlocked" : isNext ? "Next" : "Later"}
                </p>
                <p
                  className={`mt-3 text-xl font-semibold ${
                    unlocked ? "text-ink" : isNext ? "text-ink" : "text-dim"
                  }`}
                >
                  {tier.chip}
                </p>
                <p className={unlocked || isNext ? "text-mute" : "text-dim"}>
                  {tier.memory}
                </p>
                <p className={unlocked || isNext ? "text-mute" : "text-dim"}>
                  {tier.storage}
                </p>
                <p className="mt-3 text-[12px] text-dim tabular-nums">
                  {formatUsd(tier.amountRequired)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
