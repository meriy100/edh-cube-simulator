/**
 * Card recognition pipeline (runs fully on-device with OpenCV.js / WebAssembly).
 *
 * 1. detectCards: find card-shaped quadrilaterals in a photo of cards spread on a table
 * 2. warpCard: cut each card out and straighten it to the reference size (146x204, Scryfall "small")
 * 3. describe: turn a card image into a small, lighting-normalized feature vector
 * 4. matchCard: compare against the pool's reference vectors and return the closest cards
 *
 * Every function takes the OpenCV module as an argument so the same code runs in the
 * browser and in Node (for offline accuracy tests).
 */
import type * as OpenCV from "@techstark/opencv-js";

export type CV = typeof OpenCV;
type Mat = OpenCV.Mat;

export interface Point {
  x: number;
  y: number;
}

/** Corners in order: top-left, top-right, bottom-right, bottom-left (card in portrait). */
export type Quad = [Point, Point, Point, Point];

export interface CardFeature {
  art: Float32Array;
  full: Float32Array;
}

export interface ReferenceCard<T> {
  item: T;
  feature: CardFeature;
}

export interface MatchCandidate<T> {
  item: T;
  score: number;
}

export const CARD_WIDTH = 146;
export const CARD_HEIGHT = 204;
const CARD_ASPECT = 88 / 63;

// Art box of a standard frame, as a fraction of the card.
const ART_BOX = { x0: 0.08, x1: 0.92, y0: 0.11, y1: 0.56 };
const ART_SIZE = { w: 24, h: 16 };
const FULL_SIZE = { w: 12, h: 17 };
const ART_WEIGHT = 0.75;

// Tuned with synthetic photos: higher resolution and light dilation keep nearby cards separate.
const DETECT_MAX_SIDE = 1600;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Orders 4 points clockwise from top-left, then rotates so the long side is vertical. */
const toPortraitQuad = (points: Point[]): Quad => {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const sorted = points
    .slice()
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  // atan2 order starts near the left (-π); find the point closest to top-left.
  let start = 0;
  let best = Infinity;
  sorted.forEach((p, i) => {
    const v = p.x + p.y;
    if (v < best) {
      best = v;
      start = i;
    }
  });
  let quad = [0, 1, 2, 3].map((i) => sorted[(start + i) % 4]) as Quad;
  const top = distance(quad[0], quad[1]);
  const side = distance(quad[1], quad[2]);
  if (top > side) {
    // Landscape: rotate the corner order so the card becomes portrait.
    quad = [quad[3], quad[0], quad[1], quad[2]];
  }
  return quad;
};

const quadArea = ([p0, p1, p2, p3]: Quad) => {
  const edges: [Point, Point][] = [
    [p0, p1],
    [p1, p2],
    [p2, p3],
    [p3, p0],
  ];
  return Math.abs(edges.reduce((s, [a, b]) => s + a.x * b.y - b.x * a.y, 0)) / 2;
};

const quadCenter = (q: Quad): Point => ({
  x: q.reduce((s, p) => s + p.x, 0) / 4,
  y: q.reduce((s, p) => s + p.y, 0) / 4,
});

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Moves every corner toward the center by `fraction` of the way. */
const shrinkQuad = (q: Quad, fraction: number): Quad => {
  const c = quadCenter(q);
  return q.map((p) => lerp(p, c, fraction)) as Quad;
};

/** Splits a portrait quad across its long side into two (landscape) halves. */
const halveQuad = ([tl, tr, br, bl]: Quad): Quad[] => {
  const ml = lerp(tl, bl, 0.5);
  const mr = lerp(tr, br, 0.5);
  return [toPortraitQuad([tl, tr, mr, ml]), toPortraitQuad([ml, mr, br, bl])];
};

const pointInQuad = (p: Point, q: Quad) => {
  let inside = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const a = q[i];
    const b = q[j];
    if (!a || !b) continue;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
};

/** Reading order: top to bottom in rows, then left to right. */
const sortReadingOrder = <T extends { quad: Quad }>(items: T[]): T[] => {
  const rowHeight = items.length
    ? Math.sqrt(items.reduce((s, it) => s + quadArea(it.quad), 0) / items.length)
    : 1;
  return items.slice().sort((a, b) => {
    const ca = quadCenter(a.quad);
    const cb = quadCenter(b.quad);
    const ra = Math.round(ca.y / rowHeight);
    const rb = Math.round(cb.y / rowHeight);
    return ra !== rb ? ra - rb : ca.x - cb.x;
  });
};

/** Moves each corner away from the center by `amount` px along the diagonal. */
const inflatePoints = (points: Point[], amount: number): Point[] => {
  if (amount === 0) return points;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return points.map((p) => {
    const d = Math.hypot(p.x - cx, p.y - cy) || 1;
    const k = (d + amount * Math.SQRT2) / d;
    return { x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k };
  });
};

/**
 * Card-shaped contours (right aspect ratio, nearly rectangular) as portrait quads.
 * `inflate` (px at the processing scale) restores the size of regions shrunk by erosion.
 */
const collectQuads = (cv: CV, edges: Mat, scale: number, out: Quad[], inflate = 0) => {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    // RETR_LIST keeps inner contours too: a card whose outline touches a patterned
    // table or a neighbouring card still has its own inner border as a candidate.
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    const imageArea = edges.cols * edges.rows;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      try {
        const area = cv.contourArea(contour);
        if (area < imageArea * 0.003 || area > imageArea * 0.5) continue;

        const rect = cv.minAreaRect(contour);
        const long = Math.max(rect.size.width, rect.size.height);
        const short = Math.min(rect.size.width, rect.size.height);
        if (short === 0) continue;
        const aspect = long / short;
        if (aspect < CARD_ASPECT * 0.85 || aspect > CARD_ASPECT * 1.15) continue;
        // Loose on purpose (outlines touching a keyboard or the photo edge are ragged);
        // false candidates are rejected later by texture and match score.
        if (area / (long * short) < 0.6) continue;

        // Prefer the polygon's 4 corners (keeps perspective); fall back to the rotated rect.
        const approx = new cv.Mat();
        let points: Point[];
        try {
          cv.approxPolyDP(contour, approx, 0.04 * cv.arcLength(contour, true), true);
          if (approx.rows === 4 && cv.isContourConvex(approx)) {
            points = [0, 1, 2, 3].map((k) => ({
              x: approx.data32S[k * 2] ?? 0,
              y: approx.data32S[k * 2 + 1] ?? 0,
            }));
          } else {
            points = cv.RotatedRect.points(rect).map((p: Point) => ({ x: p.x, y: p.y }));
          }
        } finally {
          approx.delete();
        }
        out.push(
          toPortraitQuad(
            inflatePoints(points, inflate).map((p) => ({ x: p.x / scale, y: p.y / scale })),
          ),
        );
      } finally {
        contour.delete();
      }
    }
  } finally {
    contours.delete();
    hierarchy.delete();
  }
};

/** Drops quads that are nearly the same as an earlier one (same center and size). */
const dedupeQuads = (quads: Quad[], tolerance: number): Quad[] => {
  const kept: Quad[] = [];
  for (const q of quads) {
    const c = quadCenter(q);
    const a = quadArea(q);
    const dup = kept.some((k) => {
      const ck = quadCenter(k);
      return Math.hypot(c.x - ck.x, c.y - ck.y) < tolerance && Math.abs(quadArea(k) / a - 1) < 0.1;
    });
    if (!dup) kept.push(q);
  }
  return kept;
};

/**
 * Card-shaped regions in a photo. Deliberately generous (several edge maps, inner
 * contours too); recognizeCards keeps only the regions that match a pool card.
 */
export const findCardCandidates = (cv: CV, src: Mat): Quad[] => {
  const scale = Math.min(1, DETECT_MAX_SIDE / Math.max(src.cols, src.rows));
  const small = new cv.Mat();
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const quads: Quad[] = [];

  try {
    cv.resize(src, small, new cv.Size(0, 0), scale, scale, cv.INTER_AREA);
    cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

    for (const [low, high, dilate] of [
      [40, 120, 1],
      [20, 60, 1],
      [80, 200, 0],
    ] as const) {
      cv.Canny(gray, edges, low, high);
      if (dilate) cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), dilate);
      collectQuads(cv, edges, scale, quads);
    }

    // Dark sleeves / card borders against a lighter table, independent of edge strength.
    cv.adaptiveThreshold(
      gray,
      edges,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      51,
      10,
    );
    collectQuads(cv, edges, scale, quads);

    // Black sleeves / borders as solid dark regions. Eroding cuts thin bridges to other
    // dark things (a keyboard, the photo edge, a neighbouring sleeve).
    for (const darkness of [60, 80, 100]) {
      cv.threshold(gray, edges, darkness, 255, cv.THRESH_BINARY_INV);
      cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 2);
      for (const erode of [3, 5, 8]) {
        const eroded = new cv.Mat();
        try {
          cv.erode(edges, eroded, kernel, new cv.Point(-1, -1), erode);
          collectQuads(cv, eroded, scale, quads, erode);
        } finally {
          eroded.delete();
        }
      }
    }

    const diagonal = Math.hypot(src.cols, src.rows);
    return dedupeQuads(quads, diagonal * 0.01);
  } finally {
    small.delete();
    gray.delete();
    edges.delete();
    kernel.delete();
  }
};

export interface RecognizedCard<T> {
  quad: Quad;
  candidates: MatchCandidate<T>[];
}

/** Below this top-1 score a region is treated as background, not a card. */
export const MIN_CARD_SCORE = 0.5;
/**
 * A region counts as a card when its top-1 score is high, or it clearly beats the
 * runner-up. False detections (gaps between cards, half cards) scored 0.52–0.65 with a
 * lead under 0.09; real cards scored 0.7+ or led by 0.1+.
 */
const CONFIDENT_SCORE = 0.7;
const CONFIDENT_MARGIN = 0.1;
/** A whole region matching this well is one card; don't also try its halves. */
const SINGLE_CARD_SCORE = 0.75;
/** Below this, a region is not worth refining with smaller quads. */
const REFINE_SCORE = 0.4;

/**
 * Below this grayscale standard deviation of the art box, a region is a plain surface
 * (e.g. a table tile), not a card. Normalizing such a region amplifies noise, which can
 * still match some card. On a real photo, card art measured 30–51 and table tiles 7–11.
 */
const MIN_ART_TEXTURE = 20;

const artTextureOf = (cv: CV, card: Mat): number => {
  const gray = new cv.Mat();
  const mean = new cv.Mat();
  const std = new cv.Mat();
  const art = card.roi(
    new cv.Rect(
      Math.round(ART_BOX.x0 * card.cols),
      Math.round(ART_BOX.y0 * card.rows),
      Math.round((ART_BOX.x1 - ART_BOX.x0) * card.cols),
      Math.round((ART_BOX.y1 - ART_BOX.y0) * card.rows),
    ),
  );
  try {
    cv.cvtColor(art, gray, cv.COLOR_RGBA2GRAY);
    cv.meanStdDev(gray, mean, std);
    return std.data64F[0] ?? 0;
  } finally {
    art.delete();
    gray.delete();
    mean.delete();
    std.delete();
  }
};

/**
 * Finds the cards in a photo: matches every card-shaped region against the references,
 * keeps confident matches, and resolves overlapping regions by score.
 */
export const recognizeCards = <T>(
  cv: CV,
  src: Mat,
  references: ReferenceCard<T>[],
  { minScore = MIN_CARD_SCORE, k = 3 }: { minScore?: number; k?: number } = {},
): RecognizedCard<T>[] => {
  type Scored = RecognizedCard<T> & { score: number; margin: number };

  const evaluate = (quad: Quad): Scored | undefined => {
    const warped = warpCard(cv, src, quad);
    try {
      if (artTextureOf(cv, warped) < MIN_ART_TEXTURE) return undefined;
      const candidates = matchCard(describeBothWays(cv, warped), references, Math.max(k, 2));
      const [best, second] = candidates;
      if (!best) return undefined;
      return {
        quad,
        candidates: candidates.slice(0, k),
        score: best.score,
        margin: best.score - (second?.score ?? 0),
      };
    } finally {
      warped.delete();
    }
  };

  const better = (a: Scored | undefined, b: Scored | undefined) =>
    !a || (b && b.score > a.score) ? b : a;

  /** Scores a quad, refining it with slightly smaller quads when it looks like a card. */
  const evaluateRefined = (quad: Quad, shrinks: number[]): Scored | undefined => {
    const base = evaluate(quad);
    if (!base || base.score < REFINE_SCORE) return base;
    // An outline that includes the sleeve margin shifts the art box.
    return shrinks.map((f) => evaluate(shrinkQuad(quad, f))).reduce(better, base);
  };

  const isCard = (s: Scored | undefined): s is Scored =>
    !!s && s.score >= minScore && (s.score >= CONFIDENT_SCORE || s.margin >= CONFIDENT_MARGIN);

  const scored = findCardCandidates(cv, src).flatMap((quad): Scored[] => {
    const whole = evaluateRefined(quad, [0.04, 0.08]);
    if (whole && whole.score >= SINGLE_CARD_SCORE) return [whole];
    // Two landscape cards whose sleeves touch form one region with almost the same
    // aspect ratio as a single card, so also try each half. The merged region may still
    // weakly match one of the two cards; overlap resolution keeps the best.
    const halves = halveQuad(quad).map((half) => evaluateRefined(half, [0.05]));
    return [whole, ...halves].filter(isCard);
  });

  // Highest score first; a region overlapping an accepted card is the same card
  // (sleeve vs. card edge, art box inside a card) and is dropped.
  const accepted: (RecognizedCard<T> & { score: number })[] = [];
  for (const s of scored.sort((a, b) => b.score - a.score)) {
    const center = quadCenter(s.quad);
    const overlaps = accepted.some(
      (a) => pointInQuad(center, a.quad) || pointInQuad(quadCenter(a.quad), s.quad),
    );
    if (!overlaps) accepted.push(s);
  }

  return sortReadingOrder(accepted).map(({ quad, candidates }) => ({ quad, candidates }));
};

/** Cuts a card out of the photo and straightens it to CARD_WIDTH x CARD_HEIGHT (RGBA). */
export const warpCard = (cv: CV, src: Mat, quad: Quad): Mat => {
  // Warp at 2x then downscale with area averaging, like Scryfall's resized images.
  const w = CARD_WIDTH * 2;
  const h = CARD_HEIGHT * 2;
  const from = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    quad.flatMap((p) => [p.x, p.y]),
  );
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
  const m = cv.getPerspectiveTransform(from, to);
  const big = new cv.Mat();
  const out = new cv.Mat();
  try {
    cv.warpPerspective(src, big, m, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_REPLICATE);
    cv.resize(big, out, new cv.Size(CARD_WIDTH, CARD_HEIGHT), 0, 0, cv.INTER_AREA);
    return out;
  } finally {
    from.delete();
    to.delete();
    m.delete();
    big.delete();
  }
};

/** Resizes any card image (e.g. a reference image) to CARD_WIDTH x CARD_HEIGHT. */
export const normalizeCardSize = (cv: CV, src: Mat): Mat => {
  const out = new cv.Mat();
  if (src.cols === CARD_WIDTH && src.rows === CARD_HEIGHT) {
    src.copyTo(out);
  } else {
    cv.resize(src, out, new cv.Size(CARD_WIDTH, CARD_HEIGHT), 0, 0, cv.INTER_AREA);
  }
  return out;
};

/** Downscales a region, then normalizes each color channel to zero mean / unit variance. */
const tinyVector = (cv: CV, rgba: Mat, size: { w: number; h: number }): Float32Array => {
  const tiny = new cv.Mat();
  try {
    cv.resize(rgba, tiny, new cv.Size(size.w, size.h), 0, 0, cv.INTER_AREA);
    const pixels = Array.from(tiny.data);
    const n = size.w * size.h;
    const values = [0, 1, 2].flatMap((c) => {
      const channel = Array.from({ length: n }, (_, i) => pixels[i * 4 + c] ?? 0);
      const mean = channel.reduce((s, x) => s + x, 0) / n;
      const std = Math.sqrt(channel.reduce((s, x) => s + (x - mean) ** 2, 0) / n) || 1;
      return channel.map((x) => (x - mean) / std);
    });
    // L2-normalize so a dot product is the cosine similarity.
    const norm = Math.sqrt(values.reduce((s, x) => s + x * x, 0)) || 1;
    return Float32Array.from(values, (x) => x / norm);
  } finally {
    tiny.delete();
  }
};

/** Feature vector of a CARD_WIDTH x CARD_HEIGHT RGBA card image. */
export const describe = (cv: CV, card: Mat): CardFeature => {
  const x = Math.round(ART_BOX.x0 * card.cols);
  const y = Math.round(ART_BOX.y0 * card.rows);
  const w = Math.round((ART_BOX.x1 - ART_BOX.x0) * card.cols);
  const h = Math.round((ART_BOX.y1 - ART_BOX.y0) * card.rows);
  const art = card.roi(new cv.Rect(x, y, w, h));
  try {
    return { art: tinyVector(cv, art, ART_SIZE), full: tinyVector(cv, card, FULL_SIZE) };
  } finally {
    art.delete();
  }
};

/** Features of the card as warped and turned 180° (a card may lie upside down). */
export const describeBothWays = (cv: CV, card: Mat): CardFeature[] => {
  const flipped = new cv.Mat();
  try {
    cv.rotate(card, flipped, cv.ROTATE_180);
    return [describe(cv, card), describe(cv, flipped)];
  } finally {
    flipped.delete();
  }
};

const dot = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
};

// The art vector is split into 4x4-pixel blocks (6 x 4 = 24 blocks over 24x16).
const ART_BLOCK = 4;
const ART_BLOCK_COLS = ART_SIZE.w / ART_BLOCK;
/** Worst-matching art blocks ignored, so a round sticker on the art barely matters. */
const ART_BLOCKS_DROPPED = 3;
const artBlockOf = Array.from({ length: ART_SIZE.w * ART_SIZE.h * 3 }, (_, i) => {
  const pixel = i % (ART_SIZE.w * ART_SIZE.h);
  const x = pixel % ART_SIZE.w;
  const y = Math.floor(pixel / ART_SIZE.w);
  return Math.floor(y / ART_BLOCK) * ART_BLOCK_COLS + Math.floor(x / ART_BLOCK);
});
const ART_BLOCK_COUNT = ART_BLOCK_COLS * (ART_SIZE.h / ART_BLOCK);

/** Cosine similarity of the art, leaving out the few blocks that disagree most. */
const robustArtDot = (a: Float32Array, b: Float32Array) => {
  const blocks = new Array<number>(ART_BLOCK_COUNT).fill(0);
  for (let i = 0; i < a.length; i++) {
    const block = artBlockOf[i] ?? 0;
    blocks[block] = (blocks[block] ?? 0) + (a[i] ?? 0) * (b[i] ?? 0);
  }
  blocks.sort((x, y) => x - y);
  return blocks.slice(ART_BLOCKS_DROPPED).reduce((s, x) => s + x, 0);
};

export const similarity = (a: CardFeature, b: CardFeature) =>
  ART_WEIGHT * robustArtDot(a.art, b.art) + (1 - ART_WEIGHT) * dot(a.full, b.full);

/** Top-k reference cards for a detected card (best of all given orientations). */
export const matchCard = <T>(
  features: CardFeature[],
  references: ReferenceCard<T>[],
  k = 3,
): MatchCandidate<T>[] =>
  references
    .map((ref) => ({
      item: ref.item,
      score: Math.max(...features.map((f) => similarity(f, ref.feature))),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
