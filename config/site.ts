import { MACHINE_TIERS } from "@/config/machine-tiers";
import { formatUsd } from "@/lib/format";

/**
 * Site-wide defaults. Machine prices live in machine-tiers.ts
 * (Apple India retail, converted to USD).
 * Admin can override these at runtime via site_settings.
 */

const founderAmount = MACHINE_TIERS[0]?.amountRequired ?? 0;
export const SITE_DEFAULTS = {
  minSponsorAmount: 10,
  maxSponsorAmount: 100_000,
  bidIncrement: 10,
  presetAmounts: [10, 25, 50, 100, 250] as number[],
  currency: "USD",
  creator: {
    name: "Harish",
    xUrl: "https://x.com/Harish_521",
    linkedInUrl: "",
  },
  socialProof: {
    xFollowing: 12_300,
    linkedInFollowing: null as number | null,
    monthlyImpressions: null as number | null,
    productsLaunched: null as number | null,
    pastSponsorshipResults: null as string | null,
  },
};

export type SiteSettings = typeof SITE_DEFAULTS;

/** Skin in the game. Counted in the raised total; does not occupy a sticker. */
export const FOUNDER_SPONSOR = {
  id: "founder-self",
  paymentId: "founder-self-pay",
  amount: founderAmount,
  name: "Harish",
  company: "",
  website: "https://x.com/Harish_521",
  message: `I put in ${formatUsd(founderAmount)} of my own money to start. Your sticker sits on a machine I’m already funding.`,
} as const;
