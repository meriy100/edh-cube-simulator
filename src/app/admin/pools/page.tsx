import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchPools } from "@/repository/pools";
import PoolList from "@/components/pools/PoolList";
import { FormEventHandler, Suspense, use } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { Pool } from "@/domain/entity/pool";
import FileInput from "@/components/ui/FileInput.client";

export const dynamic = "force-dynamic";

const AdminPoolsPage = () => {
  const poolsPromise = fetchPools();

  const handleInput: FormEventHandler<HTMLInputElement> = (e) => {
    console.log(e.currentTarget.files);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pool 管理" />

      <SectionCard title="Pool 登録" subtitle="Cube cobra の CSV から Pool を登録">
        <FileInput dragAndDrop fieldSize="lg" accept=".csv" onInput={handleInput} />
      </SectionCard>

      <SectionCard title="Pool 一覧">
        <Suspense fallback={<LoadingSpinner size="md" />}>
          <PoolsListContainer poolsPromise={poolsPromise} />
        </Suspense>
      </SectionCard>
    </div>
  );
};
export default AdminPoolsPage;

const PoolsListContainer = ({ poolsPromise }: { poolsPromise: Promise<Pool[]> }) => {
  const pools = use(poolsPromise);

  return <PoolList pools={pools} />;
};
