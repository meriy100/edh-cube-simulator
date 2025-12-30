"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/ui/Link";

interface Pool {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    poolCards: number;
    drafts: number;
    combos: number;
  };
}

export default function AdminPoolsPage() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPools, setSelectedPools] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "title" | "cards">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pools");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pools");
      }

      // Transform data to include counts
      const transformedPools = data.pools.map((pool: Pool) => ({
        ...pool,
        _count: {
          poolCards: pool._count?.poolCards || 0,
          drafts: pool._count?.drafts || 0,
          combos: pool._count?.combos || 0,
        },
      }));

      setPools(transformedPools);
    } catch (err) {
      console.error("Failed to fetch pools:", err);
      setError("Pool情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePool = async (id: string) => {
    if (!confirm("このPoolを削除してもよろしいですか？関連するDraftも削除されます。")) {
      return;
    }

    try {
      const response = await fetch(`/api/pools/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      setPools(pools.filter((pool) => pool.id !== id));
      setSelectedPools(new Set(Array.from(selectedPools).filter((poolId) => poolId !== id)));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPools.size === 0) return;

    if (!confirm(`選択された${selectedPools.size}個のPoolを削除してもよろしいですか？`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedPools).map(async (poolId) => {
        const response = await fetch(`/api/pools/${poolId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Pool ${poolId}: ${data.error || "削除失敗"}`);
        }
        return poolId;
      });

      const deletedIds = await Promise.all(deletePromises);
      setPools(pools.filter((pool) => !deletedIds.includes(pool.id)));
      setSelectedPools(new Set());
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(err instanceof Error ? err.message : "一括削除に失敗しました");
    }
  };

  const handleSelectAll = () => {
    if (selectedPools.size === filteredAndSortedPools.length) {
      setSelectedPools(new Set());
    } else {
      setSelectedPools(new Set(filteredAndSortedPools.map((pool) => pool.id)));
    }
  };

  const handleSelectPool = (poolId: string) => {
    const newSelected = new Set(selectedPools);
    if (newSelected.has(poolId)) {
      newSelected.delete(poolId);
    } else {
      newSelected.add(poolId);
    }
    setSelectedPools(newSelected);
  };

  // Filter and sort pools
  const filteredAndSortedPools = pools
    .filter(
      (pool) =>
        searchTerm === "" ||
        pool.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "title":
          aValue = (a.title || "").toLowerCase();
          bValue = (b.title || "").toLowerCase();
          break;
        case "cards":
          aValue = a._count.poolCards;
          bValue = b._count.poolCards;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pool管理</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            作成されたPoolの管理と操作 ({pools.length}個)
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          新しいPool作成
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Pool名またはIDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "createdAt" | "title" | "cards")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">作成日時</option>
              <option value="title">名前</option>
              <option value="cards">カード数</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedPools.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              選択項目削除 ({selectedPools.size})
            </button>
          )}
        </div>
      </div>

      {/* Pools Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedPools.size === filteredAndSortedPools.length &&
                      filteredAndSortedPools.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pool名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  統計
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedPools.map((pool) => (
                <tr key={pool.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPools.has(pool.id)}
                      onChange={() => handleSelectPool(pool.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {pool.title || "(無題)"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {pool.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div>カード: {pool._count.poolCards}</div>
                      <div>ドラフト: {pool._count.drafts}</div>
                      <div>コンボ: {pool._count.combos}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(pool.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link
                      variant="action-blue"
                      href={`/pools/${pool.id}`}
                    >
                      表示
                    </Link>
                    <Link
                      variant="action-green"
                      href={`/pools/${pool.id}/combos`}
                    >
                      コンボ
                    </Link>
                    <Link
                      variant="action-red"
                      href="#"
                      onClick={() => handleDeletePool(pool.id)}
                    >
                      削除
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedPools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "検索条件に一致するPoolが見つかりません"
                : "Poolがまだ作成されていません"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
