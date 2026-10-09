/**
 * Placement inventory. People pay for a sticker on the machine, not a donation.
 *
 * 10 equal tiles on a 4×3 grid. The Apple keeps the centre two columns of
 * the middle row. Taken spots can be claimed by paying 1.5× the current amount.
 */
export type SpotSize = "S" | "M" | "L";
export type SpotSurface = "stage" | "nav" | "footer";

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
  gridSpan: 1 | 2;
  x: number;
  y: number;
};

export const SPOTS: SpotConfig[] = [
  {
    id: "wordmark",
    number: 1,
    name: "Top left",
    description: "Upper-left tile. First sticker on the plate.",
    price: 150,
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
    price: 250,
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
    price: 200,
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
    price: 100,
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
    price: 75,
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
    price: 75,
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
    price: 50,
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
    price: 150,
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
    price: 50,
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
    price: 100,
    size: "M",
    surface: "stage",
    gridCol: 4,
    gridRow: 3,
    gridSpan: 1,
    x: 0,
    y: 0,
  },
];

export const SPOT_HOLD_MS = 20 * 60 * 1000;
