"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCardImageUrl } from "@/lib/cardImage";

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

  type ComboCard = { id: string; name: string; scryfallJson?: unknown; cubeCobra?: unknown };
  type ComboItem = { id: string; sourceId: string; cards: ComboCard[] };
  const [combos, setCombos] = useState<ComboItem[] | null>(null);
  const [comboError, setComboError] = useState<string | null>(null);
  const [comboLoading, setComboLoading] = useState(false);

  // do not early-return before hooks; guard inside effects/handlers instead

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
      if (!id) return;
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
        // refresh combos list after successful import
        void loadCombos();
      }
    } catch (e) {
      console.error(e);
      setError("アップロード中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function loadCombos() {
    try {
      setComboLoading(true);
      setComboError(null);
      const res = await fetch(`/api/pools/${id}/combos`, { method: "GET" });
      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const j = json as { error?: string };
        setComboError(j?.error || `読み込みに失敗しました (${res.status})`);
      } else {
        const data = json as { combos: ComboItem[] };
        setCombos(data.combos);
      }
    } catch (e) {
      console.error(e);
      setComboError("コンボの読み込み中にエラーが発生しました");
    } finally {
      setComboLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    void loadCombos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        <h1 className="text-2xl font-bold">Combos</h1>
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
        <section className="border border-black/10 dark:border-white/15 rounded p-4 mb-6">
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

      <section className="border border-black/10 dark:border-white/15 rounded p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Pool に登録されたコンボ一覧</h2>
          {comboLoading && <span className="text-xs opacity-70">読み込み中...</span>}
        </div>
        {comboError && (
          <div className="mb-3 text-sm text-red-700 dark:text-red-300">{comboError}</div>
        )}
        {combos && combos.length === 0 && (
          <div className="text-sm opacity-70">コンボはまだ登録されていません</div>
        )}
        {combos && combos.length > 0 && (
          <ul className="space-y-4">
            {combos.map((combo) => (
              <li
                key={combo.id}
                className="border border-black/10 dark:border-white/15 rounded p-3"
              >
                <div className="flex flex-row items-start gap-2 overflow-x-auto pb-2">
                  {combo.cards.map((card) => {
                    const url =
                      getCardImageUrl({
                        scryfallJson: card.scryfallJson,
                        cubeCobra: card.cubeCobra,
                      }) || "";
                    return (
                      <img
                        key={card.id}
                        src={url}
                        alt={card.name}
                        loading="lazy"
                        className="w-28 sm:w-32 h-auto rounded shadow-sm border border-black/10 dark:border-white/10 bg-white flex-shrink-0"
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <a
                    href={`https://commanderspellbook.com/combo/${encodeURIComponent(combo.sourceId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm underline"
                  >
                    show
                  </a>
                  <span className="text-xs opacity-70">ID: {combo.sourceId}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
