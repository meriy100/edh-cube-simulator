"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Alert from "@/components/ui/Alert";
import SectionCard from "@/components/ui/SectionCard";
import ListItem from "@/components/ui/ListItem";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Link from "@/components/ui/Link";

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
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
    try {
      setIsSaving(true);
      let res: Response;
      if (csvFile) {
        const fd = new FormData();
        fd.append("cubecobra", csvFile);
        // also send textarea just in case
        if (input) fd.append("raw", input);
        res = await fetch("/api/pools", { method: "POST", body: fd });
      } else {
        const { entries, errors } = parseMoxfieldListWithErrors(input);
        setParseErrors(errors);
        res = await fetch("/api/pools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries, raw: input }),
        });
      }
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
      <PageHeader title="EDH Cube Draft Simulator" />
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
        <label htmlFor="cube-text" className="font-medium">
          Cube プールを貼り付けてください（Moxfield 形式）
        </label>
        <Textarea
          id="cube-text"
          size="lg"
          monospace
          placeholder={
            "1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R\n1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG\n1 Accursed Marauder (MH3) 80 #2-mass-disruption #9-1-B"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="cube-csv" className="font-medium mt-2">
            または CubeCobra の CSV をアップロード
          </label>
          <input
            id="cube-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.currentTarget.files?.[0] ?? null)}
            className="block pointer-events-auto cursor-pointer"
          />
          <div className="text-xs opacity-70">
            Moxfield テキストか CSV のどちらか入力されている方が使用されます。
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isSaving} variant="primary" className="w-fit">
            {isSaving ? "保存中..." : "Submit"}
          </Button>
          {isSaving && (
            <div className="text-sm opacity-70 mt-1">保存中です。しばらくお待ちください…</div>
          )}
        </div>
      </form>

      {parseErrors.length > 0 && (
        <Alert variant="error" className="mb-6">
          <div className="font-semibold mb-2">パースに失敗した行（{parseErrors.length} 行）</div>
          <ul className="list-disc pl-5 space-y-1">
            {parseErrors.map((err, idx) => (
              <li key={`err-${idx}-${err.lineNumber}`} className="break-all">
                行 {err.lineNumber}: {err.content || "(空行)"}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <SectionCard title="Pools" className="mt-10">
        {loadingPools ? (
          <LoadingSpinner text="読み込み中..." />
        ) : (
          <div className="flex flex-col gap-2">
            {pools.length === 0 && <div className="opacity-70 text-sm">Pool はまだありません</div>}
            {pools.map((p) => (
              <ListItem
                key={p.id}
                title={p.title ?? "(untitled)"}
                subtitle={`cards: ${p.count}`}
                metadata={new Date(p.createdAt).toLocaleString()}
                actions={
                  <>
                    <Link href={`/pools/${p.id}`}>Show</Link>
                    <Button type="button" onClick={() => handleDeletePool(p.id)} variant="danger">
                      Delete
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Drafts" className="mt-10">
        {loadingDrafts ? (
          <LoadingSpinner text="読み込み中..." />
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.length === 0 && (
              <div className="opacity-70 text-sm">Draft はまだありません</div>
            )}
            {drafts.map((d) => (
              <ListItem
                key={d.id}
                title={d.pool.title ?? "(untitled)"}
                metadata={`${new Date(d.createdAt).toLocaleString()} / seat ${d.seat}`}
                actions={
                  <>
                    <Link href={`/drafts/${d.id}/picks`}>Open</Link>
                    <Button type="button" onClick={() => handleDeleteDraft(d.id)} variant="danger">
                      Delete
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
