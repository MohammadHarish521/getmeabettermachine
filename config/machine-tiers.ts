/**
 * Central machine ladder.
 *
 * `amountRequired` is the India price for that configuration,
 * converted to USD. These are not US store prices.
 *
 * Rate: ₹96.73 per $1 (10 Oct 2026 close), nearest dollar.
 * Flipkart Big Billion Days where a listing exists:
 *   M6 16GB / 256GB      ₹93,990   → $972   Flipkart BBD (was ₹99,900)
 *   M6 16GB / 512GB      ₹1,16,990          Flipkart BBD (not on this ladder)
 *   M6 24GB / 512GB      ₹1,47,900 → $1,529 Apple India (no Flipkart listing)
 *   M6 32GB / 1TB        ₹2,07,900 → $2,149 Apple India (configure-to-order)
 *   M5 Pro 24GB / 512GB  ₹1,96,990 → $2,036 Flipkart BBD (was ₹2,09,900)
 *   M5 Pro 64GB / 1TB    ₹3,89,900 → $4,031 Apple India (configure-to-order)
 *
 * Do not copy these amounts into UI components.
 * Read them through `resolveFunding()` / the database seed.
 *
 * After changing this file on a running site, prices sync on boot.
 * Admin “Reload defaults from config” also rewrites the table.
 */
export type MachineTierConfig = {
  id: string;
  sortOrder: number;
  amountRequired: number;
  machineName: string;
  chip: string;
  memory: string;
  storage: string;
  description: string;
  shortLabel: string;
  image?: string | null;
  inrPrice: number;
  priceSource: string;
};

export const MACHINE_TIERS: MachineTierConfig[] = [
  {
    id: "mini-m6-16-256",
    sortOrder: 1,
    amountRequired: 972,
    inrPrice: 93_990,
    priceSource: "Flipkart BBD",
    machineName: "Mac mini",
    chip: "M6",
    memory: "16GB",
    storage: "256GB SSD",
    shortLabel: "M6 16GB",
    description:
      "The starting machine. Enough to leave Windows behind and ship on Apple silicon.",
    image: null,
  },
  {
    id: "mini-m6-24-512",
    sortOrder: 2,
    amountRequired: 1529,
    inrPrice: 147_900,
    priceSource: "Apple India",
    machineName: "Mac mini",
    chip: "M6",
    memory: "24GB",
    storage: "512GB SSD",
    shortLabel: "M6 24GB",
    description:
      "The first real upgrade. More unified memory and room to keep projects local.",
    image: null,
  },
  {
    id: "mini-m6-32-1tb",
    sortOrder: 3,
    amountRequired: 2149,
    inrPrice: 207_900,
    priceSource: "Apple India",
    machineName: "Mac mini",
    chip: "M6",
    memory: "32GB",
    storage: "1TB SSD",
    shortLabel: "M6 32GB",
    description:
      "Headroom for simulators, design files and native builds without swapping.",
    image: null,
  },
  {
    id: "mini-pro-24-512",
    sortOrder: 4,
    amountRequired: 2036,
    inrPrice: 196_990,
    priceSource: "Flipkart BBD",
    machineName: "Mac mini",
    chip: "M5 Pro",
    memory: "24GB",
    storage: "512GB SSD",
    shortLabel: "Pro 24GB",
    description:
      "A Pro chip. The machine starts behaving like a serious build box.",
    image: null,
  },
  {
    id: "mini-pro-64-1tb",
    sortOrder: 5,
    amountRequired: 4031,
    inrPrice: 389_900,
    priceSource: "Apple India",
    machineName: "Mac mini",
    chip: "M5 Pro",
    memory: "64GB",
    storage: "1TB SSD",
    shortLabel: "Pro 64GB",
    description:
      "Future headroom. If sponsorship keeps going, the ladder does too.",
    image: null,
  },
];
