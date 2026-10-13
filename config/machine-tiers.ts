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
 * MacBook ladder, Apple India MRP, lowest current Air to the top Pro:
 *   Air 13" M5 16GB / 512GB          ₹1,49,900 → $1,550
 *   Air 15" M5 16GB / 512GB          ₹1,79,900 → $1,860
 *   Pro 14" M5 16GB / 1TB            ₹2,39,900 → $2,480
 *   Pro 16" M5 Pro 24GB / 1TB        ₹2,99,900 → $3,100  starts here
 *   Pro 16" M5 Pro 48GB / 1TB        ₹4,31,900 → $4,465  top of the ladder
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
    id: "air-m5-13-16-512",
    sortOrder: 3,
    amountRequired: 1550,
    inrPrice: 149_900,
    priceSource: "Apple India",
    machineName: "MacBook Air",
    chip: "M5",
    memory: "16GB",
    storage: "512GB SSD",
    shortLabel: "Air 13″",
    description:
      "The lowest current MacBook Air. 13-inch, M5, 16GB of memory and a 512GB SSD.",
    image: null,
  },
  {
    id: "air-m5-15-16-512",
    sortOrder: 4,
    amountRequired: 1860,
    inrPrice: 179_900,
    priceSource: "Apple India",
    machineName: "MacBook Air",
    chip: "M5",
    memory: "16GB",
    storage: "512GB SSD",
    shortLabel: "Air 15″",
    description: "The 15-inch Air. Same M5 and 16GB, with the larger screen.",
    image: null,
  },
  {
    id: "mini-m6-32-1tb",
    sortOrder: 6,
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
    sortOrder: 5,
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
    id: "pro-m5-14-16-1tb",
    sortOrder: 7,
    amountRequired: 2480,
    inrPrice: 239_900,
    priceSource: "Apple India",
    machineName: "MacBook Pro",
    chip: "M5",
    memory: "16GB",
    storage: "1TB SSD",
    shortLabel: "Pro 14″",
    description: "The entry 14-inch MacBook Pro. M5, 16GB, and a 1TB SSD.",
    image: null,
  },
  {
    id: "mini-pro-64-1tb",
    sortOrder: 9,
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
  {
    id: "pro-m5pro-16-24-1tb",
    sortOrder: 8,
    amountRequired: 3100,
    inrPrice: 299_900,
    priceSource: "Apple India",
    machineName: "MacBook Pro",
    chip: "M5 Pro",
    memory: "24GB",
    storage: "1TB SSD",
    shortLabel: "Pro 16″",
    description: "Where the 16-inch M5 Pro starts. 24GB of memory and a 1TB SSD.",
    image: null,
  },
  {
    id: "pro-m5pro-16-48-1tb",
    sortOrder: 10,
    amountRequired: 4465,
    inrPrice: 431_900,
    priceSource: "Apple India",
    machineName: "MacBook Pro",
    chip: "M5 Pro",
    memory: "48GB",
    storage: "1TB SSD",
    shortLabel: "Pro 48GB",
    description: "The top of the ladder. 16-inch M5 Pro, 48GB, and a 1TB SSD.",
    image: null,
  },
];
