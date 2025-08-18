"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  raw: string;
};

type ApiPool = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  raw: string | null;
};

type ApiResponse = {
  pool: ApiPool;
  entries: Array<{
    count: number;
    name: string;
    set: string;
    number: string;
    tags: string[];
    raw: string;
  }>;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SamplePackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [allEntries, setAllEntries] = useState<CardEntry[] | null>(null);
  const [poolMeta, setPoolMeta] = useState<ApiPool | null>(null);
  const [pack, setPack] = useState<CardEntry[] | null>(null);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  const [buildError, setBuildError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingEntries(true);
        const res = await fetch(`/api/pools/${id}`, { signal: controller.signal });
        if (!res.ok) return;
        const data: ApiResponse = await res.json();
        setPoolMeta(data.pool);
        setAllEntries(data.entries);
      } catch {
      } finally {
        setLoadingEntries(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  // Build a sample pack once entries are available
  useEffect(() => {
    if (!allEntries) return;

    // reset previous error
    setBuildError(null);

    const commanders = allEntries.filter((e) => e.tags?.some((t) => t.startsWith("#0-commander")));
    const others = allEntries.filter(
      (e) =>
        !e.tags?.some((t) => t.startsWith("#0-commander")) &&
        !e.tags?.some((t) => t.startsWith("#9-welcome-set")),
    );

    const NEED_COMMANDERS = 2;
    const NEED_TOTAL = 20;
    const needOthers = Math.max(0, NEED_TOTAL - NEED_COMMANDERS);

    if (commanders.length < NEED_COMMANDERS) {
      setBuildError(
        `パックを構築できません: 指揮官カードが不足しています（必要: ${NEED_COMMANDERS}、存在: ${commanders.length}）`,
      );
      setPack(null);
      return;
    }

    if (commanders.length + others.length < NEED_TOTAL || others.length < needOthers) {
      const total = commanders.length + others.length;
      if (others.length < needOthers) {
        setBuildError(
          `パックを構築できません: その他のカードが不足しています（必要: ${needOthers}、存在: ${others.length}）`,
        );
      } else {
        setBuildError(
          `パックを構築できません: 合計カードが不足しています（必要: ${NEED_TOTAL}、存在: ${total}）`,
        );
      }
      setPack(null);
      return;
    }

    const commanderPicks = shuffle(commanders).slice(0, NEED_COMMANDERS);
    const otherPicks = shuffle(others).slice(0, needOthers);
    const selected = [...commanderPicks, ...otherPicks];

    // Ensure ordering: commanders first
    const ordered = [
      ...selected.filter((e) => e.tags?.some((t) => t.startsWith("#0-commander"))),
      ...selected.filter((e) => !e.tags?.some((t) => t.startsWith("#0-commander"))),
    ];
    setPack(ordered);
    setBuildError(null);
  }, [allEntries]);

  // Fetch images for current pack using /api/cards
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (!pack || pack.length === 0) return;
      try {
        const names = Array.from(new Set(pack.map((p) => p.name))).join("$");
        const res = await fetch(`/api/cards?names=${encodeURIComponent(names)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, string> = {};
        for (const c of data?.cards ?? ([] as Array<{ name: string; scryfallJson: unknown }>)) {
          const j = c?.scryfallJson as unknown;
          const url =
            (j &&
              typeof j === "object" &&
              (j as { image_uris?: { normal?: string } }).image_uris?.normal) ||
            (j && typeof j === "object"
              ? (j as { card_faces?: Array<{ image_uris?: { normal?: string } }> }).card_faces?.[0]
                  ?.image_uris?.normal
              : undefined) ||
            undefined;
          if (typeof url === "string") {
            map[c.name] = url;
          }
        }
        setImageMap(map);
      } catch {}
    })();
    return () => controller.abort();
  }, [pack]);

  if (!id) return null;

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.push(`/pools/${id}`)}
          className="text-sm underline cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Sample pack</h1>
      </div>
      {poolMeta?.title && <div className="mb-2 opacity-80">{poolMeta.title}</div>}

      <section>
        <h2 className="text-xl font-semibold mb-3">Cards ({pack?.length ?? 0})</h2>
        <div className="flex flex-wrap gap-3">
          {loadingEntries ? (
            <div className="text-sm opacity-70">読み込み中...</div>
          ) : buildError ? (
            <div className="border border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded p-3 text-sm max-w-[640px]">
              {buildError}
            </div>
          ) : !pack || pack.length === 0 ? (
            <div className="text-sm opacity-70">該当なし</div>
          ) : null}
          {pack?.map((c, idx) => (
            <div
              key={`pack-${idx}-${c.name}-${c.number}`}
              className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0"
            >
              {imageMap[c.name] && (
                <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
              )}
              <div className="text-sm opacity-70">x{c.count}</div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs opacity-70">
                ({c.set}) {c.number}
              </div>
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
