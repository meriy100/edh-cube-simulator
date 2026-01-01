import PageHeader from "@/components/ui/PageHeader";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { fetchPoolXCombos } from "@/repository/poolXCombo";
import ComboSectionCard from "@/components/combos/ComboSectionCard";
import { PoolId } from "@/domain/entity/pool";
import Button from "@/components/ui/Button.client";
import BackLink from "@/components/ui/BackLink.client";

interface Props {
  params: Promise<{ id: string }>;
}

const AdminPoolCombosPage = async ({ params }: Props) => {
  const { id } = await params;
  const poolXCombos = await fetchPoolXCombos(PoolId(id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combos"
        subtitle={`${poolXCombos.length} combos`}
        backElement={<BackLink href={`/admin/pools/${id}`} />}
      />
      <Suspense fallback={<LoadingSpinner size="md" />}>
        {poolXCombos.map((poolXCombo) => (
          <ComboSectionCard key={poolXCombo.id} combo={poolXCombo.relation} size="sm" />
        ))}
      </Suspense>
    </div>
  );
};

export default AdminPoolCombosPage;
