"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, Suspense, useEffect } from "react";
import Link from "@/components/ui/Link";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router, isLoginPage]);

  if (isLoginPage) {
    return (
      <Suspense>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
      </Suspense>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content if not authenticated
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
              <Link
                variant="nav"
                href="/admin"
              >
                ダッシュボード
              </Link>
              <Link
                variant="nav"
                href="/admin/pools"
              >
                Pool管理
              </Link>
              <Link
                variant="nav"
                href="/"
              >
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
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{session.user.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{session.user.email}</p>
                </div>
              </div>
              <Link
                variant="outlined"
                href="#"
                onClick={handleLogout}
              >
                ログアウト
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-3">
              <Link
                variant="nav"
                href="/admin"
              >
                ダッシュボード
              </Link>
              <Link
                variant="nav"
                href="/admin/pools"
              >
                Pool管理
              </Link>
              <Link
                variant="nav"
                href="/"
              >
                メインサイト
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 EDH Cube Simulator Admin</p>
            <p>管理者: {session.user.email}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
