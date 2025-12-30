import PageHeader from "@/components/ui/PageHeader";
import { Suspense, use } from "react";
import { Pool } from "@/domain/entity/pool";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import PoolList from "@/components/pools/PoolList";
import { fetchPools } from "@/repository/pools";

export const dynamic = "force-dynamic";

const Home = () => {
  const poolsPromise = fetchPools();

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <PageHeader title="EDH Cube Discover" />
      <Suspense fallback={<LoadingSpinner size="md" />}>
        <PoolsListContainer poolsPromise={poolsPromise} />
      </Suspense>
    </div>
  );
};

export default Home;

const PoolsListContainer = ({ poolsPromise }: { poolsPromise: Promise<Pool[]> }) => {
  const pools = use(poolsPromise);
  return <PoolList pools={pools} />;
};
