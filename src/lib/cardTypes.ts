// Utility to extract main card types from a Scryfall-like card JSON.
// Interface: Card -> string[]
// Accepts any object that may contain a Scryfall card JSON at `scryfallJson`.

export type ScryfallCardLike =
  | {
      type_line?: unknown;
      card_faces?: Array<{ type_line?: unknown }> | null;
    }
  | null
  | undefined;

// Known main card types in Magic: The Gathering
const MAIN_TYPES = new Set<string>([
  "Artifact",
  "Battle",
  "Creature",
  "Enchantment",
  "Instant",
  "Land",
  "Planeswalker",
  "Sorcery",
  // Others that can appear in casual/ancillary sets
  "Tribal",
  "Conspiracy",
  "Plane",
  "Phenomenon",
  "Scheme",
  "Vanguard",
  "Hero",
  "Dungeon",
  "Attraction",
]);

function parseTypeLine(line: string): string[] {
  // Handle modal double-faced or split cards joined with " // "
  const parts = line.split(" // ");
  const types = new Set<string>();
  for (const part of parts) {
    const left = part.split("—")[0] || part.split("-")[0] || part; // prefer em-dash; fallback hyphen
    for (const token of left.split(/\s+/)) {
      const t = token.trim();
      if (MAIN_TYPES.has(t)) types.add(t);
    }
  }
  return Array.from(types);
}

/**
 * Extracts card types (main types only) from a Card-like object.
 * Returns an array of unique type names like ["Creature"], ["Artifact", "Land"], etc.
 */
export function getCardTypes(card: { scryfallJson?: unknown | null } | null | undefined): string[] {
  try {
    const json = (card?.scryfallJson ?? null) as ScryfallCardLike;
    // top-level type_line
    const tlUnknown =
      json && typeof json === "object" ? (json as Record<string, unknown>).type_line : undefined;
    if (typeof tlUnknown === "string" && tlUnknown.trim()) {
      const res = parseTypeLine(tlUnknown.trim());
      if (res.length > 0) return res;
    }
    // Try first face for DFCs if top-level missing
    const facesUnknown =
      json && typeof json === "object" ? (json as Record<string, unknown>).card_faces : undefined;
    const firstFace =
      Array.isArray(facesUnknown) && facesUnknown.length > 0
        ? (facesUnknown[0] as Record<string, unknown>)
        : null;
    const ftl =
      firstFace && typeof firstFace.type_line === "string"
        ? (firstFace.type_line as string).trim()
        : "";
    if (ftl) {
      const res = parseTypeLine(ftl);
      if (res.length > 0) return res;
    }
    return [];
  } catch {
    return [];
  }
}
