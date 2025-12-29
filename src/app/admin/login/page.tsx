"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import BackLink from "@/components/ui/BackLink";
import Card from "@/components/ui/Card";

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  // Check for OAuth errors in URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "AccessDenied":
          setError("アクセスが拒否されました。管理者権限のあるアカウントでログインしてください。");
          break;
        case "Configuration":
          setError("OAuth設定にエラーがあります。管理者にお問い合わせください。");
          break;
        case "Verification":
          setError("認証に失敗しました。もう一度お試しください。");
          break;
        default:
          setError("ログインでエラーが発生しました。もう一度お試しください。");
      }
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await signIn("google");
    } catch (err) {
      console.error("Login error:", err);
      setError("ログインでエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner text="読み込み中..." />
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">リダイレクト中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">管理者ログイン</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            EDH Cube Simulator の管理画面にアクセスするには、
            <br />
            管理者権限のある Google アカウントでログインしてください。
          </p>
        </div>

        <Card padding="lg" className="shadow-lg">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                ログイン中...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google でログイン
              </div>
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ログインすることで、管理者としての認証が行われます。
              <br />
              管理者権限のないアカウントではアクセスできません。
            </p>
          </div>
        </Card>

        <div className="text-center">
          <BackLink href="/">
            ← メインページに戻る
          </BackLink>
        </div>
      </div>
    </div>
  );
}
