export type ScryfallLike =
  | {
      image_uris?: { normal?: string; large?: string };
      card_faces?: Array<{ image_uris?: { normal?: string; large?: string } }>;
    }
  | null
  | undefined;

/**
 * Try to extract image URL from CubeCobra CSV row JSON.
 * Known header keys include variations like "Image URL".
 */
function getCubeCobraImageUrl(cubeRow: unknown): string | null {
  try {
    if (!cubeRow || typeof cubeRow !== "object") return null;
    const obj = cubeRow as Record<string, unknown>;
    const candidates = ["Image URL", "image url", "Image Url", "image URL", "image_url", "image"];
    for (const key of candidates) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// Internal helper to extract a specific size from a Scryfall-like JSON blob
function getImageUrlFromScryfall(
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
 * New interface: accepts a Card-like object and returns a single preferred image URL.
 * - Prefer CubeCobra's explicit image URL if available.
 * - Fallback to Scryfall's "normal" size (or first face) when CubeCobra is absent.
 */
export function getCardImageUrl(card: {
  scryfallJson?: unknown | null;
  cubeCobra?: unknown | null;
}): string | null {
  const cubeUrl = getCubeCobraImageUrl(card?.cubeCobra ?? null);
  if (cubeUrl) return cubeUrl;
  return getImageUrlFromScryfall(card?.scryfallJson ?? null, "normal");
}

/**
 * Extracts both normal and large URLs. If large is missing, it falls back to normal.
 * Prefers CubeCobra when present.
 */
export function getCardImageUrls(
  scryfallJson: unknown,
  cubeCobraRow?: unknown,
): { normal?: string; large?: string } {
  const cube = getCubeCobraImageUrl(cubeCobraRow) ?? undefined;
  if (cube) {
    // When CubeCobra provides a single image URL, use it for both sizes.
    return { normal: cube, large: cube };
  }
  const normal = getImageUrlFromScryfall(scryfallJson, "normal") ?? undefined;
  const large = getImageUrlFromScryfall(scryfallJson, "large") ?? normal;
  return { normal, large };
}
