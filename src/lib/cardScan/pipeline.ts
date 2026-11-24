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

/**
 * Finds card-shaped regions. Works best when cards are spread apart on a plain
 * surface that contrasts with the card borders.
 */
export const detectCards = (cv: CV, src: Mat): Quad[] => {
  const scale = Math.min(1, DETECT_MAX_SIDE / Math.max(src.cols, src.rows));
  const small = new cv.Mat();
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));

  try {
    cv.resize(src, small, new cv.Size(0, 0), scale, scale, cv.INTER_AREA);
    cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, edges, 40, 120);
    cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const imageArea = small.cols * small.rows;
    const quads: Quad[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      try {
        const area = cv.contourArea(contour);
        if (area < imageArea * 0.002 || area > imageArea * 0.9) continue;

        const rect = cv.minAreaRect(contour);
        const long = Math.max(rect.size.width, rect.size.height);
        const short = Math.min(rect.size.width, rect.size.height);
        if (short === 0) continue;
        const aspect = long / short;
        if (aspect < CARD_ASPECT * 0.82 || aspect > CARD_ASPECT * 1.2) continue;
        if (area / (long * short) < 0.8) continue;

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

        quads.push(toPortraitQuad(points.map((p) => ({ x: p.x / scale, y: p.y / scale }))));
      } finally {
        contour.delete();
      }
    }

    // Reading order: top to bottom in rows, then left to right.
    const rowHeight = quads.length
      ? Math.sqrt(quads.reduce((s, q) => s + quadArea(q), 0) / quads.length)
      : 1;
    return quads.sort((a, b) => {
      const ca = quadCenter(a);
      const cb = quadCenter(b);
      const ra = Math.round(ca.y / rowHeight);
      const rb = Math.round(cb.y / rowHeight);
      return ra !== rb ? ra - rb : ca.x - cb.x;
    });
  } finally {
    small.delete();
    gray.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
  }
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

export const similarity = (a: CardFeature, b: CardFeature) =>
  ART_WEIGHT * dot(a.art, b.art) + (1 - ART_WEIGHT) * dot(a.full, b.full);

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
