import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { fetchPoolXCards } from "@/repository/poolXCards";
import { PoolId } from "@/domain/entity/pool";
import PoolXCardGrid from "@/components/poolXCards/PoolXCardGrid";

interface Props {
  params: Promise<{ id: string }>;
}

const AdminPoolShowPage = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Pool" />

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
