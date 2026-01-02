import { PropsWithChildren, ReactNode, Suspense } from "react";
import AuthGuard from "@/components/AuthGuard.client";
import AdminHeader from "@/components/AdminHeader.client";
import AdminFooter from "@/components/AdminFooter.client";

export const dynamic = "force-dynamic";

const AdminLayout = ({ children }: PropsWithChildren) => {
  return (
    <AuthGuard
      loginPageContent={
        <Suspense>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
        </Suspense>
      }
      authenticatedContent={<AdminLayoutContent>{children}</AdminLayoutContent>}
    />
  );
};

const AdminLayoutContent = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense>{children}</Suspense>
        </div>
      </main>

      {/* Footer - using a separate client component for session data */}
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
