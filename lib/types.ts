import type { SpotSurface } from "@/config/spots";

export type SponsorStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "hidden";

export type PaymentStatus = "pending" | "succeeded" | "failed";
export type PaymentProvider = "dodo" | "mock";
export type ActivityType = "sponsor" | "unlock";

export type MachineTier = {
  id: string;
  sortOrder: number;
  amountRequired: number;
  machineName: string;
  chip: string;
  memory: string;
  storage: string;
  description: string;
  shortLabel: string;
  image: string | null;
};

export type SponsorRow = {
  id: string;
  name: string;
  company: string;
  website: string;
  x_url: string;
  logo_url: string;
  message: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: string;
  checkout_id: string | null;
  is_anonymous: number;
  is_visible: number;
  spot_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  sponsor_id: string;
  amount: number;
  status: string;
  provider: string;
  dodo_session_id: string | null;
  dodo_payment_id: string | null;
  checkout_url: string | null;
  created_at: string;
  processed_at: string | null;
};

export type ActivityRow = {
  id: string;
  type: string;
  sponsor_id: string | null;
  tier_id: string | null;
  amount: number | null;
  label: string;
  created_at: string;
};

export type PublicSponsor = {
  id: string;
  displayName: string;
  company: string;
  website: string | null;
  logoUrl: string;
  message: string;
  amount: number;
  createdAt: string;
  isAnonymous: boolean;
  spotId: string | null;
  spotName: string | null;
  isFounder: boolean;
};

export type PublicSpot = {
  id: string;
  number: number;
  name: string;
  description: string;
  size: "S" | "M" | "L";
  surface: SpotSurface;
  gridCol: number;
  gridRow: number;
  gridSpan: 1 | 2 | 3;
  gridRowSpan: 1 | 2;
  x: number;
  y: number;
  basePrice: number;
  currentAmount: number;
  nextPrice: number;
  held: boolean;
  clicks: number;
  occupant: PublicSponsor | null;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  label: string;
  createdAt: string;
};

export type FundingCopy = {
  raisedLabel: string;
  milestoneLabel: string;
  currentEyebrow: string;
  currentTitle: string;
  currentLine: string;
  currentSpecs: { label: string; value: string }[];
  nextEyebrow: string;
  nextTitle: string;
  nextLine: string;
  nextSpecs: { label: string; value: string }[];
  meterHeadline: string;
  meterSub: string;
};

export type FundingState = {
  raised: number;
  current: MachineTier | null;
  next: MachineTier | null;
  remaining: number;
  /** Dollars raised above the highest config. Keeps growing with no cap. */
  surplus: number;
  percentToNext: number;
  overallPercent: number;
  unlocked: MachineTier[];
  tiers: MachineTier[];
  beyondLadder: boolean;
  copy: FundingCopy;
};
