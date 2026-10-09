import { FOUNDER_SPONSOR } from "@/config/site";
import type { FundingCopy, FundingState, MachineTier } from "@/lib/types";
import { formatUsd } from "@/lib/format";

export function memoryNumber(memory: string) {
  return memory.replace(/unified memory/i, "").trim();
}

export function storageShort(storage: string) {
  return storage.replace(/\s+SSD$/i, "").trim();
}

export function formatMachineLine(tier: MachineTier) {
  return `${tier.machineName} · ${tier.chip} · ${memoryNumber(tier.memory)} · ${storageShort(tier.storage)}`;
}

export function formatMachineShort(tier: MachineTier) {
  return `${tier.chip} with ${memoryNumber(tier.memory)} and ${storageShort(tier.storage)}`;
}

export function resolveFunding(
  raised: number,
  tiers: MachineTier[],
): FundingState {
  const sorted = [...tiers].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.amountRequired - b.amountRequired,
  );
  const unlocked = sorted.filter((tier) => raised >= tier.amountRequired);
  const current = unlocked.at(-1) ?? null;
  const next = sorted.find((tier) => tier.amountRequired > raised) ?? null;
  const previousThreshold = current?.amountRequired ?? 0;
  const remaining = next ? Math.max(0, next.amountRequired - raised) : 0;
  const span = next ? next.amountRequired - previousThreshold : 0;
  const percentToNext =
    next && span > 0
      ? Math.min(100, Math.max(0, ((raised - previousThreshold) / span) * 100))
      : 100;
  const last = sorted.at(-1);
  const overallPercent =
    last && last.amountRequired > 0
      ? Math.min(100, Math.max(0, (raised / last.amountRequired) * 100))
      : 0;
  const beyondLadder = Boolean(last && raised > last.amountRequired);

  return {
    raised,
    current,
    next,
    remaining,
    percentToNext,
    overallPercent,
    unlocked,
    tiers: sorted,
    beyondLadder,
    copy: buildFundingCopy({
      raised,
      current,
      next,
      remaining,
      beyondLadder,
    }),
  };
}

function buildFundingCopy(input: {
  raised: number;
  current: MachineTier | null;
  next: MachineTier | null;
  remaining: number;
  beyondLadder: boolean;
}): FundingCopy {
  const { raised, current, next, remaining, beyondLadder } = input;
  const justUnlocked =
    current &&
    current.amountRequired > 0 &&
    raised !== FOUNDER_SPONSOR.amount &&
    raised - current.amountRequired <= 50;

  let meterHeadline: string;
  let meterSub: string;

  if (!current && next) {
    meterHeadline = "Nothing unlocked yet";
    meterSub = `${formatUsd(remaining)} more unlocks ${formatMachineShort(next)}`;
  } else if (current && next && justUnlocked) {
    meterHeadline = `We just unlocked ${memoryNumber(current.memory)}.`;
    meterSub = `Next stop: ${memoryNumber(next.memory)} and ${storageShort(next.storage)}.`;
  } else if (current && next) {
    meterHeadline = `Currently unlocked: ${formatMachineShort(current)}`;
    meterSub = `${formatUsd(remaining)} more unlocks ${memoryNumber(next.memory)} memory and ${storageShort(next.storage)} storage`;
  } else if (current && !next) {
    meterHeadline = `We've unlocked ${formatMachineShort(current)}`;
    meterSub = beyondLadder
      ? "The published ladder is complete. Further sponsors still fund a better machine."
      : "The current ladder is complete.";
  } else {
    meterHeadline = "The ladder is waiting";
    meterSub = "The first sponsor starts the upgrade.";
  }

  return {
    raisedLabel: formatUsd(raised),
    milestoneLabel: next
      ? `of next ${formatUsd(next.amountRequired)} milestone`
      : "raised",
    currentEyebrow: "Currently unlocked",
    currentTitle: current ? current.machineName : "Nothing yet",
    currentLine: current ? formatMachineLine(current) : "A machine is waiting.",
    currentSpecs: current
      ? [
          { label: "Chip", value: current.chip },
          { label: "Memory", value: memoryNumber(current.memory) },
          { label: "Storage", value: storageShort(current.storage) },
        ]
      : [
          { label: "Chip", value: "—" },
          { label: "Memory", value: "—" },
          { label: "Storage", value: "—" },
        ],
    nextEyebrow: next
      ? `${formatUsd(remaining)} more unlocks`
      : "Ladder complete",
    nextTitle: next ? next.machineName : current?.machineName ?? "Mac mini",
    nextLine: next
      ? formatMachineLine(next)
      : "Further sponsors keep improving the machine.",
    nextSpecs: next
      ? [
          { label: "Chip", value: next.chip },
          { label: "Memory", value: memoryNumber(next.memory) },
          { label: "Storage", value: storageShort(next.storage) },
        ]
      : [],
    meterHeadline,
    meterSub,
  };
}

export function markerPosition(tier: MachineTier, lastAmount: number) {
  if (lastAmount <= 0) return 0;
  return Math.min(100, Math.max(0, (tier.amountRequired / lastAmount) * 100));
}
