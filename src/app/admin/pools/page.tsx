import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchPools } from "@/repository/pools";
import PoolList from "@/components/pools/PoolList";
import { Suspense, use } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Pool } from "@/domain/entity/pool";

export const dynamic = "force-dynamic";

export default function AdminPoolsPage() {
  const poolsPromise = fetchPools();

  return (
    <div className="space-y-6">
      <PageHeader title="Pool 管理" />

      <SectionCard title="Pool 一覧">
        <Suspense fallback={<LoadingSpinner size="md" />}>
          <PoolsListContainer poolsPromise={poolsPromise} />
        </Suspense>
      </SectionCard>
    </div>
  );
}

const PoolsListContainer = ({ poolsPromise }: { poolsPromise: Promise<Pool[]> }) => {
  const pools = use(poolsPromise);

  return <PoolList pools={pools} />;
};
