"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SectionCard from "@/components/ui/SectionCard";
import TagInput from "@/components/ui/TagInput";
import TagBadge from "@/components/ui/TagBadge";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
      <PageHeader
        title="Pool Detail"
        subtitle={poolMeta?.title || undefined}
        backElement={<BackLink href="/" />}
        actions={
          <>
            <Button variant="outline" onClick={() => setIsDraftOpen(true)}>
              Draft
            </Button>
            <Button variant="outline" onClick={() => router.push(`/pools/${id}/combos`)}>
              Combos
            </Button>
            <Button variant="outline" onClick={() => setIsExportOpen(true)}>
              Export
            </Button>
            <Button variant="primary" onClick={() => router.push(`/pools/${id}/sample_pack`)}>
              Sample pack
            </Button>
          </>
        }
      />

      <SectionCard title="フィルター条件" className="mb-6">
        <TagInput
          selectedTags={selectedTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onClearTags={clearTags}
        />
      </SectionCard>

      <SectionCard
        title="Commanders"
        subtitle={`${filteredCommanders.length} cards found`}
      >
        {loadingEntries ? (
          <LoadingSpinner text="読み込み中..." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredCommanders.length === 0 && (
              <div className="text-sm opacity-70">該当なし</div>
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
                      <TagBadge
                        key={t}
                        variant="clickable"
                        size="sm"
                        onClick={() => addTag(t)}
                        title={`${t} でフィルター`}
                      >
                        {t}
                      </TagBadge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Normal Package"
        subtitle={`${filteredOthers.length} cards found`}
      >
        {loadingEntries ? (
          <LoadingSpinner text="読み込み中..." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredOthers.length === 0 && (
              <div className="text-sm opacity-70">該当なし</div>
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
                      <TagBadge
                        key={t}
                        variant="clickable"
                        size="sm"
                        onClick={() => addTag(t)}
                        title={`${t} でフィルター`}
                      >
                        {t}
                      </TagBadge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Welcome set"
        subtitle={`${filteredWelcome.length} cards found`}
      >
        {loadingEntries ? (
          <LoadingSpinner text="読み込み中..." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredWelcome.length === 0 && (
              <div className="text-sm opacity-70">該当なし</div>
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
                      <TagBadge
                        key={t}
                        variant="clickable"
                        size="sm"
                        onClick={() => addTag(t)}
                        title={`${t} でフィルター`}
                      >
                        {t}
                      </TagBadge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={isDraftOpen}
        onClose={() => setIsDraftOpen(false)}
        title="Draft"
        size="md"
      >
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
              <div className="flex justify-between items-center gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsDraftOpen(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!entries) {
                          alert("カードリストの読み込み中です");
                          return;
                        }
                        const totalPacks = (Number.isFinite(draftSeat) ? draftSeat : 8) * 3;
                        // Build candidates: exclude welcome set
                        const commanderCandidates = entries.filter(
                          (e) =>
                            e.isCommander && !e.tags.some((t) => t.startsWith("#9-welcome-set")),
                        );
                        const otherCandidates = entries.filter(
                          (e) =>
                            !e.isCommander && !e.tags.some((t) => t.startsWith("#9-welcome-set")),
                        );

                        const NEED_COMMANDERS = 2;
                        const NEED_TOTAL = 20;
                        const NEED_OTHERS = NEED_TOTAL - NEED_COMMANDERS; // 18

                        if (commanderCandidates.length < NEED_COMMANDERS * totalPacks) {
                          alert(
                            `指揮官カードが不足しています（必要: ${NEED_COMMANDERS * totalPacks}、存在: ${commanderCandidates.length}）`,
                          );
                          return;
                        }
                        if (otherCandidates.length < NEED_OTHERS * totalPacks) {
                          alert(
                            `その他カードが不足しています（必要: ${NEED_OTHERS * totalPacks}、存在: ${otherCandidates.length}）`,
                          );
                          return;
                        }

                        function shuffle<T>(arr: T[]): T[] {
                          const a = [...arr];
                          for (let i = a.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [a[i], a[j]] = [a[j], a[i]];
                          }
                          return a;
                        }

                        const used = new Set<string>();
                        let remainingCommanders = shuffle(commanderCandidates);
                        let remainingOthers = shuffle(otherCandidates);

                        function takeUnique<T extends { name: string }>(
                          source: T[],
                          n: number,
                        ): T[] {
                          const res: T[] = [];
                          let i = 0;
                          while (res.length < n && i < source.length) {
                            const item = source[i++];
                            if (used.has(item.name)) continue;
                            used.add(item.name);
                            res.push(item);
                          }
                          return res;
                        }

                        const packs: string[][] = [];
                        for (let p = 0; p < totalPacks; p++) {
                          if (
                            remainingCommanders.length < NEED_COMMANDERS ||
                            remainingOthers.length < NEED_OTHERS
                          ) {
                            remainingCommanders = shuffle(
                              remainingCommanders.filter((e) => !used.has(e.name)),
                            );
                            remainingOthers = shuffle(
                              remainingOthers.filter((e) => !used.has(e.name)),
                            );
                          }
                          const commanders = takeUnique(remainingCommanders, NEED_COMMANDERS);
                          const others = takeUnique(remainingOthers, NEED_OTHERS);
                          if (commanders.length < NEED_COMMANDERS || others.length < NEED_OTHERS) {
                            alert("カードが不足しています");
                            return;
                          }
                          packs.push([
                            ...commanders.map((c) => c.name),
                            ...others.map((o) => o.name),
                          ]);
                        }

                        const text = packs.map((pack) => pack.join("\n")).join("\n\n");

                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(text);
                        } else {
                          // Fallback copy
                          const ta = document.createElement("textarea");
                          ta.value = text;
                          ta.style.position = "fixed";
                          ta.style.left = "-9999px";
                          document.body.appendChild(ta);
                          ta.focus();
                          ta.select();
                          document.execCommand("copy");
                          document.body.removeChild(ta);
                        }
                        alert("Draftmancer 用ブースターリストをクリップボードにコピーしました");
                      } catch (err) {
                        console.error(err);
                        alert("コピーに失敗しました");
                      }
                    }}
                    title="Seat × 3 個のパックを生成し、各パック 2 指揮官 + 18 その他 (重複なし) のカード名をコピー"
                  >
                    Draftmancer
                  </Button>
                  <Button type="submit" variant="primary">
                    Confirm
                  </Button>
                </div>
              </div>
            </form>
      </Modal>

      <Modal
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Pool (Moxfield タグ付き)"
        size="xl"
      >
            <textarea
              ref={textareaRef}
              className="w-full h-72 p-2 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
              readOnly
              value={exportText}
            />
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            onClick={handleCopy}
            variant="primary"
          >
            {copied ? "Copied!" : "Copy Moxfield"}
          </Button>
          <div className="opacity-70 text-xs">Moxfield 形式: 1 Name (SET) NUMBER #tag...</div>
        </div>
      </Modal>
    </div>
  );
}
