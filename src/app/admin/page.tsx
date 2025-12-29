"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SystemStats {
  pools: {
    total: number;
    recentCount: number;
  };
  drafts: {
    total: number;
    recentCount: number;
  };
  cards: {
    total: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch pools data
        const poolsResponse = await fetch("/api/pools");
        const poolsData = await poolsResponse.json();

        // Fetch drafts data
        const draftsResponse = await fetch("/api/drafts");
        const draftsData = await draftsResponse.json();

        // Fetch cards data
        const cardsResponse = await fetch("/api/cards");
        const cardsData = await cardsResponse.json();

        // Calculate recent counts (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentPools =
          poolsData.pools?.filter(
            (pool: { createdAt: string }) => new Date(pool.createdAt) >= oneWeekAgo,
          ) || [];

        const recentDrafts =
          draftsData.drafts?.filter(
            (draft: { createdAt: string }) => new Date(draft.createdAt) >= oneWeekAgo,
          ) || [];

        setStats({
          pools: {
            total: poolsData.pools?.length || 0,
            recentCount: recentPools.length,
          },
          drafts: {
            total: draftsData.drafts?.length || 0,
            recentCount: recentDrafts.length,
          },
          cards: {
            total: cardsData.cards?.length || 0,
          },
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("統計情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          EDH Cube Simulator の管理画面へようこそ。システムの概要と管理機能にアクセスできます。
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pools Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-3l2 3-2 3m-14 2l-2-3 2-3"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pools</h3>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.pools.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  過去7日間: {stats?.pools.recentCount}個
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drafts Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Drafts</h3>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.drafts.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  過去7日間: {stats?.drafts.recentCount}個
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-3v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v3z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cards</h3>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.cards.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ユニークカード数</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/admin/pools")}
            className="p-4 text-left rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">Pool管理</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              作成されたPoolの管理と操作
            </p>
          </button>

          <button
            onClick={() => router.push("/")}
            className="p-4 text-left rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">メインサイト</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ユーザー向けメインページに移動
            </p>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="p-4 text-left rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">統計更新</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">最新の統計情報を取得</p>
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">システム情報</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              アプリケーション
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              EDH Cube Draft Simulator
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-white">認証方式</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Google OAuth 2.0</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">データベース</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">PostgreSQL (Prisma)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
