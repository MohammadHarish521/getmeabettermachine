"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";

export function LiveActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <p className="eyebrow">Live activity</p>
      <h2 className="section-title mt-3">What just happened</h2>
      {items.length === 0 ? (
        <p className="mx-auto mt-8 max-w-md text-[15px] text-mute">
          No activity yet. The log only fills with real payments and unlocked
          configurations.
        </p>
      ) : (
        <ol className="mx-auto mt-10 max-w-xl text-left">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-6 border-t border-line py-4 first:border-t-0"
            >
              <p className="text-[14px] tracking-[-0.01em]">{item.label}</p>
              <ActivityTime iso={item.createdAt} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActivityTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(timeAgo(iso));
  }, [iso]);
  return <p className="shrink-0 text-[12px] text-dim">{label}</p>;
}
