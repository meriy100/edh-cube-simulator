'use client';

import { useEffect, useMemo, useState } from "react";

type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  isCommander: boolean;
  raw: string; // original line for reference
};

type ParseError = {
  lineNumber: number;
  content: string;
};

function parseMoxfieldListWithErrors(text: string): { entries: CardEntry[]; errors: ParseError[] } {
  const lines = text.split(/\r?\n/);
  const entries: CardEntry[] = [];
  const errors: ParseError[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const raw = line;
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Match: count name (SET) number [tags]
    const m = trimmed.match(/^(\d+)\s+(.+?)\s+\(([A-Za-z0-9]+)\)\s+([A-Za-z0-9\-\/]+)(?:\s+(.*))?$/);
    if (!m) {
      errors.push({ lineNumber: i + 1, content: raw });
      continue;
    }
    const [, countStr, name, set, num, tail] = m;
    const count = parseInt(countStr, 10) || 0;
    const tags = (tail || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter((t) => t.startsWith("#"));
    const isCommander = tags.some((t) => t.startsWith("#0-commander"));
    entries.push({ count, name, set, number: num, tags, isCommander, raw });
  }
  return { entries, errors };
}

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [pool, setPool] = useState<CardEntry[] | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  const welcomeSet = useMemo(() => (pool ?? []).filter((c) => c.tags.some((t) => t.startsWith('#9-welcome-set'))), [pool]);
  const commanders = useMemo(() => (pool ?? []).filter((c) => c.isCommander && !c.tags.some((t) => t.startsWith('#9-welcome-set'))), [pool]);
  const others = useMemo(() => (pool ?? []).filter((c) => !c.isCommander && !c.tags.some((t) => t.startsWith('#9-welcome-set'))), [pool]);

  const filteredCommanders = useMemo(() => {
    if (selectedTags.length === 0) return commanders;
    return commanders.filter((c) => selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))));
  }, [commanders, selectedTags]);

  const filteredWelcome = useMemo(() => {
    if (selectedTags.length === 0) return welcomeSet;
    return welcomeSet.filter((c) => selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))));
  }, [welcomeSet, selectedTags]);

  const filteredOthers = useMemo(() => {
    if (selectedTags.length === 0) return others;
    return others.filter((c) => selectedTags.every((t) => c.tags.some((tag) => tag.startsWith(t))));
  }, [others, selectedTags]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { entries, errors } = parseMoxfieldListWithErrors(input);
    setPool(entries);
    setParseErrors(errors);
    setImageMap({});

    // Save to DB via API when parsing succeeds (save all entries, even if some lines had errors)
    try {
      setSaveStatus("saving");
      setSaveMessage("");
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus("error");
        setSaveMessage(data?.error || "保存に失敗しました");
      } else {
        setSaveStatus("saved");
        setSaveMessage(`${data?.count ?? 0} 件を保存しました`);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setSaveMessage("サーバーエラーが発生しました");
    }
  }

  function normalizeTag(t: string): string | null {
    const tt = t.trim();
    if (!tt) return null;
    return tt.startsWith('#') ? tt : `#${tt}`;
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

  // Fetch scryfall images for current pool
  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      if (!pool || pool.length === 0) return;
      try {
        const names = Array.from(new Set(pool.map((p) => p.name))).join('$');
        const res = await fetch(`/api/cards?names=${encodeURIComponent(names)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, string> = {};
        for (const c of (data?.cards ?? [] as Array<{ name: string; scryfallJson: unknown }>)) {
          const j = c?.scryfallJson as unknown;
          const url = (
            j && typeof j === 'object' && (j as { image_uris?: { normal?: string } }).image_uris?.normal
          ) || (
            j && typeof j === 'object'
              ? (j as { card_faces?: Array<{ image_uris?: { normal?: string } }> }).card_faces?.[0]?.image_uris?.normal
              : undefined
          ) || undefined;
          if (typeof url === 'string') {
            map[c.name] = url;
          }
        }
        setImageMap(map);
      } catch (e) {
        // ignore
      }
    }
    run();
    return () => controller.abort();
  }, [pool]);

  function handleAddTagFromInput(e: React.FormEvent) {
    e.preventDefault();
    if (!tagInput.trim()) return;
    addTag(tagInput);
    setTagInput("");
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <h1 className="text-2xl font-bold mb-4">EDH Cube Draft Simulator</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
        <label htmlFor="cube-text" className="font-medium">Cube プールを貼り付けてください（Moxfield 形式）</label>
        <textarea
          id="cube-text"
          className="w-full min-h-48 h-60 p-3 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
          placeholder={'1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R\n1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG\n1 Accursed Marauder (MH3) 80 #2-mass-disruption #9-1-B'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="rounded bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 w-fit"
          >
            Submit
          </button>
        </div>
      </form>

      {parseErrors.length > 0 && (
        <div className="mb-6 border border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded p-3">
          <div className="font-semibold mb-2">パースに失敗した行（{parseErrors.length} 行）</div>
          <ul className="list-disc pl-5 space-y-1">
            {parseErrors.map((err, idx) => (
              <li key={`err-${idx}-${err.lineNumber}`} className="break-all">
                行 {err.lineNumber}: {err.content || "(空行)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pool && (
        <div className="flex flex-col gap-8">
          <div className="rounded border border-black/10 dark:border-white/15 p-3">
            <div className="text-sm">
              保存状態: {saveStatus === 'idle' && '未保存'}{saveStatus === 'saving' && '保存中...'}{saveStatus === 'saved' && '保存済み'}{saveStatus === 'error' && 'エラー'}
            </div>
            {saveMessage && <div className="mt-1 text-sm opacity-80">{saveMessage}</div>}
          </div>
          <section className="border border-black/10 dark:border-white/15 rounded p-3">
            <h2 className="text-lg font-semibold mb-3">フィルター条件</h2>
            <form onSubmit={handleAddTagFromInput} className="flex flex-wrap items-center gap-2 mb-3">
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
                className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90"
              >
                タグを追加
              </button>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={clearTags}
                  className="ml-auto text-xs opacity-80 underline hover:opacity-100"
                >すべてクリア</button>
              )}
            </form>
            <div className="flex flex-wrap gap-2">
              {selectedTags.length === 0 && (
                <div className="text-sm opacity-70">（未指定）</div>
              )}
              {selectedTags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded bg-black/5 dark:bg-white/10">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    aria-label={`${t} を削除`}
                    className="rounded px-1 hover:bg-black/10 dark:hover:bg-white/20"
                  >×</button>
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Commanders ({filteredCommanders.length})</h2>
            <div className="flex flex-wrap gap-3">
              {filteredCommanders.length === 0 && (
                <div className="text-sm opacity-70">該当なし</div>
              )}
              {filteredCommanders.map((c, idx) => (
                <div key={`commander-${idx}-${c.name}-${c.number}`} className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0">
                  {imageMap[c.name] && (
                    <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
                  )}
                  <div className="text-sm opacity-70">x{c.count}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">({c.set}) {c.number}</div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => addTag(t)}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                          title={`${t} でフィルター`}
                        >{t}</button>
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
              {filteredOthers.length === 0 && (
                <div className="text-sm opacity-70">該当なし</div>
              )}
              {filteredOthers.map((c, idx) => (
                <div key={`other-${idx}-${c.name}-${c.number}`} className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0">
                  {imageMap[c.name] && (
                    <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
                  )}
                  <div className="text-sm opacity-70">x{c.count}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">({c.set}) {c.number}</div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => addTag(t)}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                          title={`${t} でフィルター`}
                        >{t}</button>
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
              {filteredWelcome.length === 0 && (
                <div className="text-sm opacity-70">該当なし</div>
              )}
              {filteredWelcome.map((c, idx) => (
                <div key={`welcome-${idx}-${c.name}-${c.number}`} className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0">
                  {imageMap[c.name] && (
                    <img src={imageMap[c.name]} alt={c.name} className="w-full rounded mb-2" />
                  )}
                  <div className="text-sm opacity-70">x{c.count}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">({c.set}) {c.number}</div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => addTag(t)}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                          title={`${t} でフィルター`}
                        >{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
