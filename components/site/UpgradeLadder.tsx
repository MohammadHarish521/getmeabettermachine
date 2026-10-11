import { formatUsd } from "@/lib/format";
import type { FundingState, MachineTier } from "@/lib/types";

export function UpgradeLadder({ funding }: { funding: FundingState }) {
  const { tiers, raised, next, surplus } = funding;
  const groups = groupByMachine(tiers);

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 text-center sm:px-6 lg:py-24">
      <p className="eyebrow">The ladder</p>
      <h2 className="section-title mx-auto mt-3 max-w-[18ch]">
        Every sponsor makes the machine better.
      </h2>

      <div className="mx-auto mt-10 max-w-xl text-left">
        {groups.map((group, index) => (
          <div key={`${group.name}-${index}`} className="border-t border-line">
            <h3 className="pt-5 text-[12px] font-semibold tracking-[0.08em] text-dim uppercase">
              {group.name}
            </h3>
            <ul>
              {group.tiers.map((tier) => {
                const unlocked = raised >= tier.amountRequired;
                const isNext = next?.id === tier.id;
                const quiet = !unlocked && !isNext;
                return (
                  <li
                    key={tier.id}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <p
                      className={`min-w-0 text-[15px] tracking-[-0.02em] ${
                        quiet ? "text-dim" : "text-ink"
                      }`}
                    >
                      <span className="font-medium">{tier.chip}</span>
                      <span className={quiet ? "" : "text-mute"}>
                        {" "}
                        · {tier.memory.replace(/unified memory/i, "").trim()} ·{" "}
                        {tier.storage.replace(/\s+SSD$/i, "")}
                      </span>
                    </p>
                    <p className="flex shrink-0 items-center gap-2.5">
                      {isNext ? <span className="badge badge-status">Next</span> : null}
                      <span
                        className={`text-[14px] tabular-nums ${
                          quiet ? "text-dim" : "font-medium text-ink"
                        }`}
                      >
                        {formatUsd(tier.amountRequired)}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
          <p className={surplus > 0 ? "text-[15px] font-medium text-ink" : "text-[15px] text-dim"}>
            Past the top
            <span className={surplus > 0 ? "font-normal text-mute" : ""}>
              {" "}
              · keeps counting
            </span>
          </p>
          <p
            className={`shrink-0 text-[14px] tabular-nums ${
              surplus > 0 ? "font-medium text-green" : "text-dim"
            }`}
          >
            {surplus > 0 ? `+${formatUsd(surplus)}` : "+ more"}
          </p>
        </div>
      </div>
    </section>
  );
}

function groupByMachine(tiers: MachineTier[]) {
  const groups: { name: string; tiers: MachineTier[] }[] = [];
  for (const tier of tiers) {
    const last = groups.at(-1);
    if (last?.name === tier.machineName) last.tiers.push(tier);
    else groups.push({ name: tier.machineName, tiers: [tier] });
  }
  return groups;
}
