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
      ? Math.max(0, (raised / last.amountRequired) * 100)
      : 0;
  const surplus =
    last && raised > last.amountRequired ? raised - last.amountRequired : 0;
  const beyondLadder = surplus > 0;

  return {
    raised,
    current,
    next,
    remaining,
    surplus,
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
      surplus,
      beyondLadder,
    }),
  };
}

function buildFundingCopy(input: {
  raised: number;
  current: MachineTier | null;
  next: MachineTier | null;
  remaining: number;
  surplus: number;
  beyondLadder: boolean;
}): FundingCopy {
  const { raised, current, next, remaining, surplus, beyondLadder } = input;
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
  } else if (current && !next && beyondLadder) {
    meterHeadline = `${formatMachineShort(current)} is covered`;
    meterSub = `+${formatUsd(surplus)} more than this config needs. It keeps counting.`;
  } else if (current && !next) {
    meterHeadline = `We've unlocked ${formatMachineShort(current)}`;
    meterSub = "Anything further still counts, past this config.";
  } else {
    meterHeadline = "The ladder is waiting";
    meterSub = "The first sponsor starts the upgrade.";
  }

  return {
    raisedLabel: formatUsd(raised),
    milestoneLabel: next
      ? `of next ${formatUsd(next.amountRequired)} milestone`
      : beyondLadder
        ? `+${formatUsd(surplus)} more than needed`
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
      : beyondLadder
        ? `+${formatUsd(surplus)} more than needed`
        : "Top config funded",
    nextTitle: next ? next.machineName : beyondLadder ? "Still counting" : current?.machineName ?? "Mac",
    nextLine: next
      ? formatMachineLine(next)
      : beyondLadder
        ? `+${formatUsd(surplus)} more than the top config needs.`
        : "Anything further still counts.",
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
