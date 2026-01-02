import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { fetchPoolXCards } from "@/repository/poolXCards";
import { PoolId } from "@/domain/entity/pool";
import PoolXCardGrid from "@/components/poolXCards/PoolXCardGrid";
import Button from "@/components/ui/Button.client";
import PoolForm from "@/app/admin/pools/[id]/PoolForm.client";
import { fetchPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import PublishButton from "@/app/admin/pools/[id]/PublishButton.client";

interface Props {
  params: Promise<{ id: string }>;
}

const AdminPoolShowPage = async ({ params }: Props) => {
  const { id } = await params;
  const pool = await fetchPool(PoolId(id));
  if (!pool) {
    return <Alert variant="error">Pool not found</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pool"
        actions={
          <div className="flex flex-row gap-2">
            <Button href={`/admin/pools/${id}/combos`} variant="secondary">
              Combos
            </Button>
            {pool.published ? null : <PublishButton pool={pool} />}
          </div>
        }
      />
      <PoolForm pool={pool} />

      <SectionCard title="Commander cards">
        <Suspense fallback={<LoadingSpinner size="md" />}>
          <PoolXCardGridContainer poolId={PoolId(id)} commander={true} />
        </Suspense>
      </SectionCard>
      <SectionCard title="Normal cards">
        <Suspense fallback={<LoadingSpinner size="md" />}>
          <PoolXCardGridContainer poolId={PoolId(id)} commander={false} />
        </Suspense>
      </SectionCard>
    </div>
  );
};

export default AdminPoolShowPage;

const PoolXCardGridContainer = async ({
  poolId,
  commander,
}: {
  poolId: PoolId;
  commander: boolean;
}) => {
  const poolXCards = await fetchPoolXCards(poolId, { commander });

  return <PoolXCardGrid poolXCards={poolXCards} />;
};
