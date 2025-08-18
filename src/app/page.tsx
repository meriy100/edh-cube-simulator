"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const m = trimmed.match(
      /^(\d+)\s+(.+?)\s+\(([A-Za-z0-9]+)\)\s+([A-Za-z0-9\-\/]+)(?:\s+(.*))?$/,
    );
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
  const router = useRouter();
  const [input, setInput] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [pools, setPools] = useState<
    Array<{ id: string; title: string | null; createdAt: string; count: number }>
  >([]);
  const [loadingPools, setLoadingPools] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<
    Array<{
      id: string;
      createdAt: string;
      seat: number;
      pool: { id: string; title: string | null };
    }>
  >([]);
  const [loadingDrafts, setLoadingDrafts] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { entries, errors } = parseMoxfieldListWithErrors(input);
    setParseErrors(errors);
    try {
      setIsSaving(true);
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, raw: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "保存に失敗しました");
        return;
      }
      if (data?.poolId) {
        router.push(`/pools/${data.poolId}`);
      }
    } catch (err) {
      console.error(err);
      alert("サーバーエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  }

  // Load pools list
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingPools(true);
        const res = await fetch("/api/pools");
        const data = await res.json();
        if (res.ok && active) {
          const items = (data?.pools ?? []).map(
            (p: {
              id: string;
              title: string | null;
              createdAt: string;
              _count?: { poolCards: number };
            }) => ({
              id: p.id,
              title: p.title ?? null,
              createdAt: p.createdAt,
              count: p._count?.poolCards ?? 0,
            }),
          );
          setPools(items);
        }
      } finally {
        if (active) setLoadingPools(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load drafts list (latest 15)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingDrafts(true);
        const res = await fetch("/api/drafts");
        const data = await res.json();
        if (res.ok && active) {
          const items = (data?.drafts ?? []).map(
            (d: {
              id: string;
              createdAt: string;
              seat: number;
              pool: { id: string; title: string | null };
            }) => ({
              id: d.id,
              createdAt: d.createdAt,
              seat: d.seat,
              pool: { id: d.pool.id, title: d.pool.title ?? null },
            }),
          );
          setDrafts(items);
        }
      } finally {
        if (active) setLoadingDrafts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleDeletePool(id: string) {
    if (!confirm("この pool を削除しますか？")) return;
    const res = await fetch(`/api/pools/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "削除に失敗しました");
      return;
    }
    setPools((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleDeleteDraft(id: string) {
    if (!confirm("この draft を削除しますか？")) return;
    const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "削除に失敗しました");
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <h1 className="text-2xl font-bold mb-4">EDH Cube Draft Simulator</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
        <label htmlFor="cube-text" className="font-medium">
          Cube プールを貼り付けてください（Moxfield 形式）
        </label>
        <textarea
          id="cube-text"
          className="w-full min-h-48 h-60 p-3 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
          placeholder={
            "1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R\n1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG\n1 Accursed Marauder (MH3) 80 #2-mass-disruption #9-1-B"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 w-fit disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "Submit"}
          </button>
          {isSaving && (
            <div className="text-sm opacity-70 mt-1">保存中です。しばらくお待ちください…</div>
          )}
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-3">Pools</h2>
        {loadingPools ? (
          <div className="opacity-70 text-sm">読み込み中...</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {pools.length === 0 && <li className="opacity-70 text-sm">Pool はまだありません</li>}
            {pools.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 border border-black/10 dark:border-white/15 rounded p-2"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {p.title ?? "(untitled)"}{" "}
                    <span className="opacity-70 text-xs">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="opacity-70 text-xs">cards: {p.count}</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/pools/${p.id}`)}
                  className="text-sm underline"
                >
                  Show
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePool(p.id)}
                  className="text-sm underline text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-3">Drafts</h2>
        {loadingDrafts ? (
          <div className="opacity-70 text-sm">読み込み中...</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {drafts.length === 0 && <li className="opacity-70 text-sm">Draft はまだありません</li>}
            {drafts.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 border border-black/10 dark:border-white/15 rounded p-2"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {d.pool.title ?? "(untitled)"}{" "}
                    <span className="opacity-70 text-xs">
                      {new Date(d.createdAt).toLocaleString()} / seat {d.seat}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/drafts/${d.id}/picks`)}
                  className="text-sm underline"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDraft(d.id)}
                  className="text-sm underline text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
