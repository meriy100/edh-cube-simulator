"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CombosImportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    created: number;
    ignored: Array<{
      rowIndex: number;
      sourceId?: string;
      missing: Array<{ key: string; value: string }>;
    }>;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  if (!id) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError("CSV ファイルを選択してください");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("csv", file);
      const res = await fetch(`/api/pools/${id}/combos`, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const j = json as { error?: string };
        setError(j?.error || `エラーが発生しました (${res.status})`);
      } else {
        setResult(
          json as {
            created: number;
            ignored: Array<{
              rowIndex: number;
              sourceId?: string;
              missing: Array<{ key: string; value: string }>;
            }>;
          },
        );
      }
    } catch (e) {
      console.error(e);
      setError("アップロード中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-2xl font-bold">Combos Import</h1>
      </div>

      <section className="border border-black/10 dark:border-white/15 rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Commander Spellbook CSV をインポート</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block"
          />
          <button
            type="submit"
            disabled={loading || !file}
            className="w-fit rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "アップロード中..." : "インポート"}
          </button>
        </form>
      </section>

      {error && (
        <div className="border border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded p-3 text-sm mb-6">
          {error}
        </div>
      )}

      {result && (
        <section className="border border-black/10 dark:border-white/15 rounded p-4">
          <h2 className="text-lg font-semibold mb-3">結果</h2>
          <div className="mb-2 text-sm">作成: {result.created}</div>
          {result.ignored.length > 0 ? (
            <div>
              <div className="mb-2 text-sm">以下の行は無視されました（カード未検出）:</div>
              <ul className="space-y-2">
                {result.ignored.map((ig, i) => (
                  <li key={i} className="text-sm">
                    <div>
                      行 {ig.rowIndex}
                      {ig.sourceId ? ` (ID: ${ig.sourceId})` : ""}
                    </div>
                    <ul className="ml-4 list-disc">
                      {ig.missing.map((m, j) => (
                        <li key={j}>
                          {m.key}: {m.value}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm opacity-70">無視された行はありません</div>
          )}
        </section>
      )}
    </div>
  );
}
