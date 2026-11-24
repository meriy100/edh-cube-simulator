"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Copy } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import Alert from "@/components/ui/Alert.client";
import Button from "@/components/ui/Button.client";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { loadOpenCv } from "@/lib/cardScan/opencv";
import {
  CV,
  describe,
  describeBothWays,
  detectCards,
  matchCard,
  MatchCandidate,
  normalizeCardSize,
  Quad,
  ReferenceCard,
  warpCard,
} from "@/lib/cardScan/pipeline";

export interface ScanPoolCard {
  id: string;
  name: string;
  nameJa: string;
  imageUrl: string;
}

interface Detection {
  quad: Quad;
  cropUrl: string;
  candidates: MatchCandidate<ScanPoolCard>[];
  /** Index into candidates, or null for "not in the list". */
  choice: number | null;
  needsReview: boolean;
}

interface ScanResult {
  overlayUrl: string;
  detections: Detection[];
  elapsedMs: number;
}

type Status =
  | { kind: "loading" }
  | { kind: "indexing"; done: number; total: number }
  | { kind: "ready"; failed: number }
  | { kind: "error"; message: string };

// A top-1 lead smaller than this was a sign of a wrong match in synthetic tests.
const REVIEW_MARGIN = 0.06;
const PHOTO_MAX_SIDE = 2400;
const INDEX_CONCURRENCY = 8;

const loadImage = (src: string, crossOrigin = true) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });

const imageToMat = (cv: CV, img: CanvasImageSource, width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.drawImage(img, 0, 0, width, height);
  return cv.matFromImageData(ctx.getImageData(0, 0, width, height));
};

const matToDataUrl = (mat: { cols: number; rows: number; data: Uint8Array }) => {
  const canvas = document.createElement("canvas");
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(new ImageData(new Uint8ClampedArray(mat.data), mat.cols, mat.rows), 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
};

const drawOverlay = (img: HTMLImageElement, quads: Quad[], scale: number) => {
  const maxSide = 1200;
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * s);
  canvas.height = Math.round(img.naturalHeight * s);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // Quads are in the processed photo's coordinates; map them to the overlay canvas.
  const k = s / scale;
  quads.forEach((q, i) => {
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.beginPath();
    q.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x * k, p.y * k) : ctx.lineTo(p.x * k, p.y * k)));
    ctx.closePath();
    ctx.stroke();
    const cx = (q.reduce((a, p) => a + p.x, 0) / 4) * k;
    const cy = (q.reduce((a, p) => a + p.y, 0) / 4) * k;
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), cx, cy);
  });
  return canvas.toDataURL("image/jpeg", 0.85);
};

interface Props {
  cards: ScanPoolCard[];
}

const CardScanner = ({ cards }: Props) => {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult>();
  const [scanError, setScanError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const cvRef = useRef<CV>(undefined);
  const refsRef = useRef<ReferenceCard<ScanPoolCard>[]>([]);

  // Load OpenCV and build the reference features for every card in the pool.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const cv = await loadOpenCv();
        if (cancelled) return;
        cvRef.current = cv;
        setStatus({ kind: "indexing", done: 0, total: cards.length });

        const refs: ReferenceCard<ScanPoolCard>[] = [];
        let done = 0;
        let failed = 0;
        let next = 0;
        const worker = async () => {
          while (!cancelled) {
            const card = cards[next++];
            if (!card) break;
            try {
              const img = await loadImage(card.imageUrl);
              const mat = imageToMat(cv, img, img.naturalWidth, img.naturalHeight);
              const norm = normalizeCardSize(cv, mat);
              refs.push({ item: card, feature: describe(cv, norm) });
              mat.delete();
              norm.delete();
            } catch (e) {
              console.warn("Reference failed", card.name, e);
              failed++;
            }
            done++;
            if (done % 20 === 0 || done === cards.length) {
              setStatus({ kind: "indexing", done, total: cards.length });
            }
          }
        };
        await Promise.all(Array.from({ length: INDEX_CONCURRENCY }, worker));
        if (cancelled) return;
        refsRef.current = refs;
        setStatus({ kind: "ready", failed });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [cards]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const cv = cvRef.current;
    if (!file || !cv) return;

    setProcessing(true);
    setScanError(undefined);
    setCopied(false);
    // Let the spinner render before the synchronous OpenCV work.
    await new Promise((r) => setTimeout(r, 50));

    const url = URL.createObjectURL(file);
    try {
      const started = performance.now();
      const img = await loadImage(url, false);
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const photo = imageToMat(
        cv,
        img,
        Math.round(img.naturalWidth * scale),
        Math.round(img.naturalHeight * scale),
      );
      try {
        const quads = detectCards(cv, photo);
        const detections = quads.map((quad): Detection => {
          const warped = warpCard(cv, photo, quad);
          try {
            const candidates = matchCard(describeBothWays(cv, warped), refsRef.current, 3);
            const [first, second] = candidates;
            const margin = first && second ? first.score - second.score : 1;
            return {
              quad,
              cropUrl: matToDataUrl(warped),
              candidates,
              choice: 0,
              needsReview: margin < REVIEW_MARGIN,
            };
          } finally {
            warped.delete();
          }
        });
        setResult({
          overlayUrl: drawOverlay(img, quads, scale),
          detections,
          elapsedMs: Math.round(performance.now() - started),
        });
      } finally {
        photo.delete();
      }
    } catch (err) {
      console.error(err);
      setScanError(err instanceof Error ? err.message : String(err));
    } finally {
      URL.revokeObjectURL(url);
      setProcessing(false);
    }
  };

  const choose = (index: number, choice: number | null) => {
    setResult((r) =>
      r
        ? {
            ...r,
            detections: r.detections.map((d, i) => (i === index ? { ...d, choice } : d)),
          }
        : r,
    );
  };

  const picks = (result?.detections ?? []).flatMap((d) => {
    const picked = d.choice === null ? undefined : d.candidates[d.choice];
    return picked ? [picked.item] : [];
  });
  const changed = (result?.detections ?? []).filter((d) => d.choice !== 0).length;
  const reviewCount = (result?.detections ?? []).filter((d) => d.needsReview).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(picks.map((c) => `1 ${c.name}`).join("\n"));
    setCopied(true);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="写真を撮る"
        subtitle="カードが重ならないように、無地の机に離して並べて真上から撮影してください"
      >
        <div className="space-y-4">
          {status.kind === "loading" && (
            <div className="flex items-center gap-2 text-sm">
              <LoadingSpinner size="sm" /> 認識エンジンを読み込み中...
            </div>
          )}
          {status.kind === "indexing" && (
            <div className="flex items-center gap-2 text-sm">
              <LoadingSpinner size="sm" /> カード画像を準備中... {status.done} / {status.total}
            </div>
          )}
          {status.kind === "error" && (
            <Alert variant="error">認識エンジンの準備に失敗しました: {status.message}</Alert>
          )}
          {status.kind === "ready" && status.failed > 0 && (
            <Alert variant="warning">{status.failed} 枚のカード画像を読み込めませんでした</Alert>
          )}
          {scanError && <Alert variant="error">認識に失敗しました: {scanError}</Alert>}

          <label
            className={`inline-flex items-center gap-2 rounded border px-4 py-2 font-medium ${
              status.kind === "ready" && !processing
                ? "cursor-pointer bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                : "cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300"
            }`}
          >
            {processing ? <LoadingSpinner size="sm" /> : <Camera size={18} />}
            {processing ? "認識中..." : "撮影 / 写真を選択"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={status.kind !== "ready" || processing}
              onChange={handleFile}
            />
          </label>
        </div>
      </SectionCard>

      {result && (
        <>
          <SectionCard
            title={`認識結果: ${result.detections.length} 枚`}
            subtitle={`処理時間 ${result.elapsedMs}ms / 要確認 ${reviewCount} 枚 / 修正 ${changed} 枚`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            <img src={result.overlayUrl} alt="検出したカード" className="w-full rounded" />
          </SectionCard>

          <SectionCard
            title="カードごとの候補"
            subtitle="間違っていたら正しい候補を選ぶか「該当なし」を押してください"
          >
            <div className="space-y-3">
              {result.detections.map((d, i) => (
                <div
                  key={i}
                  className={`flex gap-3 items-start rounded border p-2 ${
                    d.needsReview
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-black/10 dark:border-white/15"
                  }`}
                >
                  <div className="w-20 shrink-0 text-center">
                    <div className="text-sm font-bold">#{i + 1}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                    <img src={d.cropUrl} alt={`検出 ${i + 1}`} className="w-full rounded" />
                    {d.needsReview && (
                      <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        要確認
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {d.candidates.map((c, ci) => (
                      <button
                        key={c.item.id}
                        type="button"
                        onClick={() => choose(i, ci)}
                        className={`w-24 sm:w-28 cursor-pointer rounded border-2 p-1 text-left ${
                          d.choice === ci
                            ? "border-emerald-500"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall image */}
                        <img src={c.item.imageUrl} alt={c.item.nameJa} className="w-full rounded" />
                        <div className="mt-1 text-xs leading-tight">{c.item.nameJa}</div>
                        <div className="text-[11px] opacity-60">{c.score.toFixed(3)}</div>
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={d.choice === null ? "danger" : "outline"}
                    onClick={() => choose(i, null)}
                  >
                    該当なし
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={`ピック内容: ${picks.length} 枚`}
            footerActions={
              <Button icon={Copy} variant="outline" onClick={handleCopy} disabled={!picks.length}>
                {copied ? "コピーしました" : "コピー"}
              </Button>
            }
          >
            <ul className="text-sm columns-1 sm:columns-2 lg:columns-3">
              {picks.map((c, i) => (
                <li key={`${c.id}-${i}`}>
                  {c.nameJa}
                  {c.nameJa !== c.name && <span className="opacity-60"> / {c.name}</span>}
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default CardScanner;
