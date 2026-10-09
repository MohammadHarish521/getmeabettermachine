/**
 * Central machine ladder.
 *
 * `amountRequired` is the Apple India retail price for that
 * configuration, converted to USD. These are not US store prices.
 *
 * Rate: ₹96.31 per $1 (2 Oct 2026 close), rounded to the nearest dollar.
 *   M6 16GB / 256GB      ₹99,900   → $1,037
 *   M6 24GB / 512GB      ₹1,47,900 → $1,536
 *   M6 32GB / 1TB        ₹2,07,900 → $2,159
 *   M5 Pro 24GB / 512GB  ₹2,09,900 → $2,179
 *   M5 Pro 64GB / 1TB    ₹3,89,900 → $4,048
 *
 * Do not copy these amounts into UI components.
 * Read them through `resolveFunding()` / the database seed.
 *
 * After changing this file on a running site, open Admin and
 * use “Reload defaults from config” — or empty the machine_tiers
 * table so it reseeds on the next boot.
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
};

export const MACHINE_TIERS: MachineTierConfig[] = [
  {
    id: "mini-m6-16-256",
    sortOrder: 1,
    amountRequired: 1037,
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
    amountRequired: 1536,
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
    amountRequired: 2159,
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
    amountRequired: 2179,
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
    amountRequired: 4048,
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
