export type ScryfallLike =
  | {
      image_uris?: { normal?: string; large?: string };
      card_faces?: Array<{ image_uris?: { normal?: string; large?: string } }>;
    }
  | null
  | undefined;

/**
 * Extracts the preferred image URL from Scryfall-like JSON.
 * - Tries top-level image_uris first, then falls back to first face.
 * - Returns null if not found or not a string.
 */
export function getCardImageUrl(
  scryfallJson: unknown,
  size: "normal" | "large" = "normal",
): string | null {
  try {
    if (!scryfallJson || typeof scryfallJson !== "object") return null;
    const obj = scryfallJson as ScryfallLike;
    const top = obj?.image_uris?.[size];
    if (typeof top === "string" && top) return top;
    const face = Array.isArray(obj?.card_faces) ? obj!.card_faces![0] : undefined;
    const faceUrl = face?.image_uris?.[size];
    return typeof faceUrl === "string" && faceUrl ? faceUrl : null;
  } catch {
    return null;
  }
}

/**
 * Extracts both normal and large URLs. If large is missing, it falls back to normal.
 */
export function getCardImageUrls(scryfallJson: unknown): { normal?: string; large?: string } {
  const normal = getCardImageUrl(scryfallJson, "normal") ?? undefined;
  const large = getCardImageUrl(scryfallJson, "large") ?? normal;
  return { normal, large };
}
