import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchPools } from "@/repository/pools";
import PoolList from "@/components/pools/PoolList";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import NewPoolForm from "@/app/admin/pools/NewPoolForm.client";

export const dynamic = "force-dynamic";

const AdminPoolsPage = async () => {
  const pools = await fetchPools();

  return (
    <div className="space-y-6">
      <PageHeader title="Pool 管理" />

      <NewPoolForm />

      <SectionCard title="Pool 一覧">
        <Suspense fallback={<LoadingSpinner size="md" />}>
          <PoolList pools={pools} />
        </Suspense>
      </SectionCard>
    </div>
  );
};
export default AdminPoolsPage;
