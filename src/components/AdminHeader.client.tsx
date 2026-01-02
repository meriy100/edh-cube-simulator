"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "@/components/ui/Link.client";

const AdminHeader = () => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              EDH Cube Simulator - 管理画面
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link variant="nav" href="/admin">
              ダッシュボード
            </Link>
            <Link variant="nav" href="/admin/pools">
              Pool管理
            </Link>
            <Link variant="nav" href="/">
              メインサイト
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{session.user.name}</p>
                <p className="text-gray-500 dark:text-gray-400">{session.user.email}</p>
              </div>
            </div>
            <Link variant="outlined" href="#" onClick={handleLogout}>
              ログアウト
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3">
            <Link variant="nav" href="/admin">
              ダッシュボード
            </Link>
            <Link variant="nav" href="/admin/pools">
              Pool管理
            </Link>
            <Link variant="nav" href="/">
              メインサイト
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
