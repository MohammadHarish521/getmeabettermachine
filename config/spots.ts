/**
 * Placement inventory. People pay for a sticker on the machine, not a donation.
 *
 * 10 equal tiles on a 4×3 grid. The Apple keeps the centre two columns of
 * the middle row. Taken spots can be claimed by paying 1.5× the current amount.
 */
export type SpotSize = "S" | "M" | "L";
export type SpotSurface = "stage" | "front" | "back" | "adapter" | "mouse";

export const SURFACE_LABEL: Record<SpotSurface, string> = {
  stage: "Top",
  front: "Front",
  back: "Back",
  adapter: "Power adapter",
  mouse: "Magic Mouse",
};

export type SpotConfig = {
  id: string;
  number: number;
  name: string;
  description: string;
  price: number;
  size: SpotSize;
  surface: SpotSurface;
  /** 1-based CSS grid column / row on the Mac face (4 columns × 3 rows). */
  gridCol: number;
  gridRow: number;
  gridSpan: 1 | 2 | 3;
  gridRowSpan?: 1 | 2;
  x: number;
  y: number;
};

export const SPOTS: SpotConfig[] = [
  {
    id: "wordmark",
    number: 1,
    name: "Top left",
    description: "Upper-left tile. First sticker on the plate.",
    price: 200,
    size: "M",
    surface: "stage",
    gridCol: 1,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "top-plate",
    number: 2,
    name: "Top",
    description: "Upper row, left of centre. Sits above the Apple.",
    price: 330,
    size: "L",
    surface: "stage",
    gridCol: 2,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "spec-badge",
    number: 3,
    name: "Top",
    description: "Upper row, right of centre. Same band as the marquee.",
    price: 260,
    size: "L",
    surface: "stage",
    gridCol: 3,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "right-side",
    number: 7,
    name: "Top right",
    description: "Upper-right tile. Opposite corner from top left.",
    price: 130,
    size: "M",
    surface: "stage",
    gridCol: 4,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "desk-left",
    number: 5,
    name: "Middle left",
    description: "Flanks the Apple on the left. Same row as the logo.",
    price: 100,
    size: "S",
    surface: "stage",
    gridCol: 1,
    gridRow: 2,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "desk-right",
    number: 6,
    name: "Middle right",
    description: "Flanks the Apple on the right. Same row as the logo.",
    price: 100,
    size: "S",
    surface: "stage",
    gridCol: 4,
    gridRow: 2,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "desk-front",
    number: 8,
    name: "Bottom left",
    description: "Lower-left tile. Still on the face of the Mac.",
    price: 70,
    size: "M",
    surface: "stage",
    gridCol: 1,
    gridRow: 3,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "front-edge",
    number: 9,
    name: "Bottom",
    description: "Lower row, left of centre. Under the Apple.",
    price: 200,
    size: "M",
    surface: "stage",
    gridCol: 2,
    gridRow: 3,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "footer",
    number: 10,
    name: "Bottom",
    description: "Lower row, right of centre. Same band, other side.",
    price: 70,
    size: "M",
    surface: "stage",
    gridCol: 3,
    gridRow: 3,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "left-side",
    number: 4,
    name: "Bottom right",
    description: "Lower-right tile. Last sticker on the plate.",
    price: 130,
    size: "M",
    surface: "stage",
    gridCol: 4,
    gridRow: 3,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "front-left",
    number: 11,
    name: "Front left",
    description: "Left sticker on the front face, beside the ports.",
    price: 50,
    size: "S",
    surface: "front",
    gridCol: 1,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "front-center",
    number: 12,
    name: "Front center",
    description: "Center of the front plate. Visible on the desk.",
    price: 70,
    size: "S",
    surface: "front",
    gridCol: 2,
    gridRow: 1,
    gridSpan: 1,
    gridRowSpan: 2,
    x: 0,
    y: 0,
  },
  {
    id: "front-right",
    number: 13,
    name: "Front right",
    description: "Right sticker on the front face, beside the ports.",
    price: 50,
    size: "S",
    surface: "front",
    gridCol: 3,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "power-cable",
    number: 14,
    name: "The power cable",
    description: "A sticker on the Mac mini power adapter. Funds the cable itself.",
    price: 30,
    size: "S",
    surface: "adapter",
    gridCol: 1,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "magic-mouse",
    number: 15,
    name: "The Magic Mouse",
    description: "A sticker on the Magic Mouse. Funds the mouse itself.",
    price: 40,
    size: "S",
    surface: "mouse",
    gridCol: 1,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "back-left",
    number: 16,
    name: "Back left",
    description: "Left of the power inlet on the back of the mini.",
    price: 50,
    size: "S",
    surface: "back",
    gridCol: 1,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
  {
    id: "back-right",
    number: 18,
    name: "Back right",
    description: "Right of the Thunderbolt ports on the back of the mini.",
    price: 50,
    size: "S",
    surface: "back",
    gridCol: 3,
    gridRow: 1,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
];

export const SPOT_HOLD_MS = 20 * 60 * 1000;

/** Checkout id for buying every spot at once. Taken spots count at 1.5×. */
export const ALL_SPOTS_ID = "all";

/** Shorter than SPOT_HOLD_MS: an abandoned all-spots checkout freezes the whole board. */
export const ALL_SPOTS_HOLD_MS = 10 * 60 * 1000;
