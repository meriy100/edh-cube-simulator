"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import StatCard from "@/components/ui/StatCard";
import ActionCard from "@/components/ui/ActionCard";
import PageHeader from "@/components/ui/PageHeader";

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
        <LoadingSpinner text="読み込み中..." />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <PageHeader
          title="管理ダッシュボード"
          subtitle="EDH Cube Simulator の管理画面へようこそ。システムの概要と管理機能にアクセスできます。"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pools"
          value={stats?.pools.total || 0}
          subtitle={`過去7日間: ${stats?.pools.recentCount || 0}個`}
          color="blue"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14-3l2 3-2 3m-14 2l-2-3 2-3"
              />
            </svg>
          }
        />

        <StatCard
          title="Drafts"
          value={stats?.drafts.total || 0}
          subtitle={`過去7日間: ${stats?.drafts.recentCount || 0}個`}
          color="green"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />

        <StatCard
          title="Cards"
          value={stats?.cards.total || 0}
          subtitle="ユニークカード数"
          color="purple"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14-3v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v3z"
              />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Pool管理"
            description="作成されたPoolの管理と操作"
            onClick={() => router.push("/admin/pools")}
          />
          <ActionCard
            title="メインサイト"
            description="ユーザー向けメインページに移動"
            onClick={() => router.push("/")}
          />
          <ActionCard
            title="統計更新"
            description="最新の統計情報を取得"
            onClick={() => window.location.reload()}
          />
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
