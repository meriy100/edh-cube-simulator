"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  isCommander: boolean;
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

export default function PoolPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [entries, setEntries] = useState<CardEntry[] | null>(null);
  const [poolMeta, setPoolMeta] = useState<ApiPool | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [typeMap, setTypeMap] = useState<Record<string, string[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  // Draft modal state
  const [isDraftOpen, setIsDraftOpen] = useState<boolean>(false);
  const [draftSeat, setDraftSeat] = useState<number>(8);
  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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
        const list: CardEntry[] = data.entries.map((e) => ({
          ...e,
          isCommander: Array.isArray(e.tags) && e.tags.some((t) => t.startsWith("#0-commander")),
        }));
        setEntries(list);
      } catch {
      } finally {
        setLoadingEntries(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  const welcomeSet = useMemo(
    () => (entries ?? []).filter((c) => c.tags.some((t) => t.startsWith("#9-welcome-set"))),
    [entries],
  );
  const commanders = useMemo(
    () =>
      (entries ?? []).filter(
        (c) => c.isCommander && !c.tags.some((t) => t.startsWith("#9-welcome-set")),
      ),
    [entries],
  );
  const others = useMemo(
    () =>
      (entries ?? []).filter(
        (c) => !c.isCommander && !c.tags.some((t) => t.startsWith("#9-welcome-set")),
      ),
    [entries],
  );

  const filteredCommanders = useMemo(() => {
    if (selectedTags.length === 0) return commanders;
    return commanders.filter((c) =>
      selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))),
    );
  }, [commanders, selectedTags]);

  const filteredWelcome = useMemo(() => {
    if (selectedTags.length === 0) return welcomeSet;
    return welcomeSet.filter((c) =>
      selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))),
    );
  }, [welcomeSet, selectedTags]);

  const filteredOthers = useMemo(() => {
    if (selectedTags.length === 0) return others;
    return others.filter((c) => selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))));
  }, [others, selectedTags]);

  // Build export text in Moxfield (tagged) format matching root page input
  const exportText = useMemo(() => {
    const list = entries ?? [];
    return list
      .map((e) => {
        const base = `${e.count} ${e.name} (${e.set}) ${e.number}`;
        const tags = (e.tags ?? []).filter(Boolean).join(" ");
        return tags ? `${base} ${tags}` : base;
      })
      .join("\n");
  }, [entries]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportText);
      } else {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.select();
          document.execCommand("copy");
          ta.setSelectionRange(0, 0);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("copy failed", e);
      alert("コピーに失敗しました");
    }
  }

  // Fetch images for current entries using /api/cards
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (!entries || entries.length === 0) return;
      try {
        const names = Array.from(new Set(entries.map((p) => p.name))).join("$");
        const res = await fetch(`/api/cards?names=${encodeURIComponent(names)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const imgMap: Record<string, string> = {};
        const typMap: Record<string, string[]> = {};
        // Consolidated card image URL and type extraction
        const [{ getCardImageUrl }, { getCardTypes }] = await Promise.all([
          import("@/lib/cardImage"),
          import("@/lib/cardTypes"),
        ]);
        for (const c of data?.cards ??
          ([] as Array<{ name: string; scryfallJson: unknown; cubeCobra?: unknown }>)) {
          const url = getCardImageUrl(c as { scryfallJson?: unknown; cubeCobra?: unknown });
          if (typeof url === "string" && url) {
            imgMap[c.name] = url;
          }
          const types = getCardTypes(c as { scryfallJson?: unknown });
          if (Array.isArray(types) && types.length > 0) {
            typMap[c.name] = types;
          }
        }
        setImageMap(imgMap);
        setTypeMap(typMap);
      } catch {}
    })();
    return () => controller.abort();
  }, [entries]);

  function normalizeTag(t: string): string | null {
    const tt = t.trim();
    if (!tt) return null;
    return tt.startsWith("#") ? tt : `#${tt}`;
  }

  function addTag(tag: string) {
    const n = normalizeTag(tag);
    if (!n) return;
    setSelectedTags((prev) => (prev.includes(n) ? prev : [...prev, n]));
  }

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function clearTags() {
    setSelectedTags([]);
  }

  if (!id) return null;

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm underline cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Pool Detail</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDraftOpen(true)}
            className="rounded border border-foreground/50 text-foreground px-3 py-1.5 text-sm font-semibold hover:bg-foreground/5 cursor-pointer"
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => router.push(`/pools/${id}/combos`)}
            className="rounded border border-foreground/50 text-foreground px-3 py-1.5 text-sm font-semibold hover:bg-foreground/5 cursor-pointer"
          >
            Combos
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="rounded border border-foreground/50 text-foreground px-3 py-1.5 text-sm font-semibold hover:bg-foreground/5 cursor-pointer"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => router.push(`/pools/${id}/sample_pack`)}
            className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            Sample pack
          </button>
        </div>
      </div>
      {poolMeta?.title && <div className="mb-2 opacity-80">{poolMeta.title}</div>}

      <section className="border border-black/10 dark:border-white/15 rounded p-3 mb-6">
        <h2 className="text-lg font-semibold mb-3">フィルター条件</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!tagInput.trim()) return;
            addTag(tagInput);
            setTagInput("");
          }}
          className="flex flex-wrap items-center gap-2 mb-3"
        >
          <input
            type="text"
            placeholder="#タグ名 を入力（# は省略可）"
            value={tagInput}
            data-1p-ignore
            onChange={(e) => setTagInput(e.target.value)}
            className="px-2 py-1 rounded border border-black/10 dark:border-white/20 bg-transparent text-sm"
          />
          <button
            type="submit"
            className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            タグを追加
          </button>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={clearTags}
              className="ml-auto text-xs opacity-80 underline hover:opacity-100 cursor-pointer"
            >
              すべてクリア
            </button>
          )}
        </form>
        <div className="flex flex-wrap gap-2">
          {selectedTags.length === 0 && <div className="text-sm opacity-70">（未指定）</div>}
          {selectedTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded bg-black/5 dark:bg-white/10"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`${t} を削除`}
                className="rounded px-1 hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Commanders ({filteredCommanders.length})</h2>
        <div className="flex flex-wrap gap-3">
          {loadingEntries ? (
            <div className="text-sm opacity-70">読み込み中...</div>
          ) : (
            filteredCommanders.length === 0 && <div className="text-sm opacity-70">該当なし</div>
          )}
          {filteredCommanders.map((c, idx) => (
            <div
              key={`commander-${idx}-${c.name}-${c.number}`}
              className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0"
            >
              {imageMap[c.name] && (
                <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
              )}
              <div className="text-sm opacity-70">x{c.count}</div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs opacity-70">
                ({c.set}) {c.number}
                {Array.isArray(typeMap[c.name]) && typeMap[c.name].length > 0 && (
                  <> · {typeMap[c.name].join(" / ")}</>
                )}
              </div>
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                      title={`${t} でフィルター`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Normal Package ({filteredOthers.length})</h2>
        <div className="flex flex-wrap gap-3">
          {loadingEntries ? (
            <div className="text-sm opacity-70">読み込み中...</div>
          ) : (
            filteredOthers.length === 0 && <div className="text-sm opacity-70">該当なし</div>
          )}
          {filteredOthers.map((c, idx) => (
            <div
              key={`other-${idx}-${c.name}-${c.number}`}
              className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0"
            >
              {imageMap[c.name] && (
                <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
              )}
              <div className="text-sm opacity-70">x{c.count}</div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs opacity-70">
                ({c.set}) {c.number}
                {Array.isArray(typeMap[c.name]) && typeMap[c.name].length > 0 && (
                  <> · {typeMap[c.name].join(" / ")}</>
                )}
              </div>
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                      title={`${t} でフィルター`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Welcome set ({filteredWelcome.length})</h2>
        <div className="flex flex-wrap gap-3">
          {loadingEntries ? (
            <div className="text-sm opacity-70">読み込み中...</div>
          ) : (
            filteredWelcome.length === 0 && <div className="text-sm opacity-70">該当なし</div>
          )}
          {filteredWelcome.map((c, idx) => (
            <div
              key={`welcome-${idx}-${c.name}-${c.number}`}
              className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0"
            >
              {imageMap[c.name] && (
                <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
              )}
              <div className="text-sm opacity-70">x{c.count}</div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs opacity-70">
                ({c.set}) {c.number}
                {Array.isArray(typeMap[c.name]) && typeMap[c.name].length > 0 && (
                  <> · {typeMap[c.name].join(" / ")}</>
                )}
              </div>
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                      title={`${t} でフィルター`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {isDraftOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="draft-modal-title"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={() => setIsDraftOpen(false)}
            aria-hidden="true"
          />
          {/* dialog */}
          <div className="relative z-10 w-full max-w-md rounded-lg border border-black/10 dark:border-white/15 bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 id="draft-modal-title" className="text-lg font-semibold">
                Draft
              </h3>
              <button
                type="button"
                onClick={() => setIsDraftOpen(false)}
                aria-label="Close"
                className="rounded px-2 py-1 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`/api/drafts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ seat: draftSeat, pool_id: id }),
                  });
                  if (!res.ok) {
                    const j = (await res.json().catch(() => ({}) as unknown)) as Record<
                      string,
                      unknown
                    >;
                    alert(`Draft 作成に失敗しました: ${j?.error ?? res.status}`);
                  } else {
                    const data = (await res.json().catch(() => ({}))) as {
                      draft?: { id: string };
                    };
                    if (data?.draft?.id) {
                      // Navigate to first pick page for this draft
                      router.push(`/drafts/${data.draft.id}/picks/1`);
                    } else {
                      // Fallback: close modal if response unexpected
                      setIsDraftOpen(false);
                    }
                  }
                } catch (err) {
                  console.error(err);
                  alert("Draft 作成中にエラーが発生しました");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="draft-seat" className="block text-sm font-medium mb-1">
                  Seat
                </label>
                <input
                  id="draft-seat"
                  type="number"
                  min={1}
                  step={1}
                  value={Number.isFinite(draftSeat) ? draftSeat : 8}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setDraftSeat(Number.isNaN(v) ? 8 : v);
                  }}
                  className="w-full px-2 py-1 rounded border border-black/10 dark:border-white/20 bg-transparent"
                />
                <p className="mt-1 text-xs opacity-70">デフォルト 8</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDraftOpen(false)}
                  className="rounded px-3 py-1.5 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={() => setIsExportOpen(false)}
            aria-hidden="true"
          />
          {/* dialog */}
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-black/10 dark:border-white/15 bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 id="export-modal-title" className="text-lg font-semibold">
                Export Pool (Moxfield タグ付き)
              </h3>
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                aria-label="Close"
                className="rounded px-2 py-1 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                ×
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full h-72 p-2 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
              readOnly
              value={exportText}
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                {copied ? "Copied!" : "Copy Moxfield"}
              </button>
              <div className="opacity-70 text-xs">Moxfield 形式: 1 Name (SET) NUMBER #tag...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
