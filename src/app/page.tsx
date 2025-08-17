'use client';

import { useMemo, useState } from "react";

type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  isCommander: boolean;
  raw: string; // original line for reference
};

function parseMoxfieldList(text: string): CardEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: CardEntry[] = [];
  for (const line of lines) {
    const raw = line;
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Match: count name (SET) number [tags]
    const m = trimmed.match(/^(\d+)\s+(.+?)\s+\(([A-Za-z0-9]+)\)\s+([A-Za-z0-9]+)(?:\s+(.*))?$/);
    if (!m) {
      // If it doesn't match, skip but we could still record as raw
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
  return entries;
}

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [pool, setPool] = useState<CardEntry[] | null>(null);

  const commanders = useMemo(() => (pool ?? []).filter((c) => c.isCommander), [pool]);
  const others = useMemo(() => (pool ?? []).filter((c) => !c.isCommander), [pool]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseMoxfieldList(input);
    setPool(parsed);
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
        <div>
          <button
            type="submit"
            className="rounded bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            Submit
          </button>
        </div>
      </form>

      {pool && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Commanders ({commanders.length})</h2>
            <div className="flex flex-wrap gap-3">
              {commanders.length === 0 && (
                <div className="text-sm opacity-70">該当なし</div>
              )}
              {commanders.map((c, idx) => (
                <div key={`commander-${idx}-${c.name}-${c.number}`} className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0">
                  <div className="text-sm opacity-70">x{c.count}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">({c.set}) {c.number}</div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Others ({others.length})</h2>
            <div className="flex flex-wrap gap-3">
              {others.length === 0 && (
                <div className="text-sm opacity-70">該当なし</div>
              )}
              {others.map((c, idx) => (
                <div key={`other-${idx}-${c.name}-${c.number}`} className="border border-black/10 dark:border-white/15 rounded p-3 w-[260px] flex-shrink-0">
                  <div className="text-sm opacity-70">x{c.count}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">({c.set}) {c.number}</div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">{t}</span>
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
