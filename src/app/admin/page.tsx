"use client";

import { useRouter } from "next/navigation";
import StatCard from "@/components/ui/StatCard.client";
import ActionCard from "@/components/ui/ActionCard.client";
import PageHeader from "@/components/ui/PageHeader";

export default function AdminDashboard() {
  const router = useRouter();

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
          value={0}
          subtitle={`過去7日間: ${0}個`}
          color="blue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
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
          title="Cards"
          value={0}
          subtitle="ユニークカード数"
          color="purple"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
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
        </div>
      </div>
    </div>
  );
}
