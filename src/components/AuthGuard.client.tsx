"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthGuardProps {
  loginPageContent: ReactNode;
  authenticatedContent: ReactNode;
}

const AuthGuard = ({ loginPageContent, authenticatedContent }: AuthGuardProps) => {
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

  // For login page, render login page content
  if (isLoginPage) {
    return <>{loginPageContent}</>;
  }

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

  return <>{authenticatedContent}</>;
};

export default AuthGuard;