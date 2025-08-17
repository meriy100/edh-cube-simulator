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

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/pools/${id}`, { signal: controller.signal });
        if (!res.ok) return;
        const data: ApiResponse = await res.json();
        setPoolMeta(data.pool);
        setAllEntries(data.entries);
      } catch {}
    })();
    return () => controller.abort();
  }, [id]);

  // Build a sample pack once entries are available
  useEffect(() => {
    if (!allEntries) return;
    const commanders = allEntries.filter((e) => e.tags?.some((t) => t.startsWith("#0-commander")));
    const others = allEntries.filter(
      (e) =>
        !e.tags?.some((t) => t.startsWith("#0-commander")) &&
        !e.tags?.some((t) => t.startsWith("#9-welcome-set")),
    );

    const commanderPicks = shuffle(commanders).slice(0, 2);
    const otherPicks = shuffle(others).slice(0, Math.max(0, 20 - commanderPicks.length));
    const selected = [...commanderPicks, ...otherPicks];

    // Ensure ordering: commanders first
    const ordered = [
      ...selected.filter((e) => e.tags?.some((t) => t.startsWith("#0-commander"))),
      ...selected.filter((e) => !e.tags?.some((t) => t.startsWith("#0-commander"))),
    ];
    setPack(ordered);
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
          className="text-sm underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Sample pack</h1>
      </div>
      {poolMeta?.title && <div className="mb-2 opacity-80">{poolMeta.title}</div>}

      <section>
        <h2 className="text-xl font-semibold mb-3">Cards ({pack?.length ?? 0})</h2>
        <div className="flex flex-wrap gap-3">
          {(!pack || pack.length === 0) && <div className="text-sm opacity-70">該当なし</div>}
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
