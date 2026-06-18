// ---- accent palette ---------------------------------------------------------
// One canonical set of accent keys. Each maps to an icon-tile background plus a
// tag/chip colour set (bg/fg/border) and a phase-dot colour. This is the
// reference design's pastel palette, generalised so every key is first-class
// (the original had to inline a colour for the green Poker tile).

export const ACCENT_KEYS = [
  "blue", "sky", "teal", "green", "purple", "amber", "coral", "red", "rose", "gray",
] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

export interface Accent {
  tile: string; // icon-tile background
  bg: string; // tag/chip background
  fg: string; // tag/chip text
  border: string; // tag/chip border
  dot: string; // phase dot / list accent
}

export const ACCENT: Record<AccentKey, Accent> = {
  blue: { tile: "#E6F1FB", bg: "#E6F1FB", fg: "#0C447C", border: "#B5D4F4", dot: "#185FA5" },
  sky: { tile: "#E0F4FF", bg: "#E0F4FF", fg: "#0A4A6E", border: "#9AD8F7", dot: "#0A7BC0" },
  teal: { tile: "#E1F5EE", bg: "#E1F5EE", fg: "#085041", border: "#9FE1CB", dot: "#0F6E56" },
  green: { tile: "#E1F5EE", bg: "#E1F5EE", fg: "#085041", border: "#9FE1CB", dot: "#1F8A5B" },
  purple: { tile: "#EEEDFE", bg: "#EEEDFE", fg: "#3C3489", border: "#CECBF6", dot: "#534AB7" },
  amber: { tile: "#FAEEDA", bg: "#FAEEDA", fg: "#633806", border: "#FAC775", dot: "#BA7517" },
  coral: { tile: "#FAECE7", bg: "#FAECE7", fg: "#4A1B0C", border: "#F5C4B3", dot: "#C0470A" },
  red: { tile: "#FDEEF2", bg: "#FDEEF2", fg: "#6B1530", border: "#F5B8CB", dot: "#C0290A" },
  rose: { tile: "#FDEEF2", bg: "#FDEEF2", fg: "#6B1530", border: "#F5B8CB", dot: "#B5184A" },
  gray: { tile: "#EEEEE8", bg: "#F1EFE8", fg: "#2C2C2A", border: "#D3D1C7", dot: "#6B6B63" },
};

export const DEFAULT_ACCENT: AccentKey = "blue";

export function accentOf(key: unknown): AccentKey {
  return typeof key === "string" && (ACCENT_KEYS as readonly string[]).includes(key)
    ? (key as AccentKey)
    : DEFAULT_ACCENT;
}

// Vivid subset used to colour tags deterministically (no per-tag colour stored).
const TAG_PALETTE: AccentKey[] = ["blue", "teal", "purple", "amber", "coral", "sky", "rose", "green"];

export function tagAccent(label: string): AccentKey {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

// ---- stages -----------------------------------------------------------------

export const STAGES = ["seed", "exploring", "building", "shipped", "shelved"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  seed: "Seed",
  exploring: "Exploring",
  building: "Building",
  shipped: "Shipped",
  shelved: "Shelved",
};

export function stageOf(value: unknown): Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value)
    ? (value as Stage)
    : "seed";
}

// ---- content blocks ---------------------------------------------------------
// The reference's per-card sections (Core systems / layers / variants grids,
// the Progression arc, the chaos-events box, the Reference links) all reduce to
// these four repeatable block types. An idea holds an ordered list of them, so
// any idea can have any number and order of sections.

export const BLOCK_TYPES = ["grid", "phases", "list", "links"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABEL: Record<BlockType, string> = {
  grid: "Feature grid",
  phases: "Phases",
  list: "Callout list",
  links: "Links",
};

export interface GridItem { name: string; desc: string }
export interface PhaseItem { name: string; text: string; dot?: AccentKey }
export interface LinkItem { label: string; url: string }

export type Block =
  | { type: "grid"; label: string; items: GridItem[] }
  | { type: "phases"; label: string; items: PhaseItem[] }
  | { type: "list"; label: string; tone?: AccentKey; items: string[] }
  | { type: "links"; label: string; items: LinkItem[] };

// ---- the idea ---------------------------------------------------------------

export interface Idea {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // emoji
  accent: AccentKey;
  stage: Stage;
  concept: string;
  tags: string[];
  sections: Block[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
