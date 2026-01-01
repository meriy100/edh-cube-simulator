import PageHeader from "@/components/ui/PageHeader";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { fetchPoolXCombos } from "@/repository/poolXCombo";
import ComboSectionCard from "@/components/combos/ComboSectionCard";
import { PoolId } from "@/domain/entity/pool";
import BackLink from "@/components/ui/BackLink.client";
import TranslateButton from "@/app/admin/pools/[id]/combos/TranslateButton.client";
import { comboUnTranslated } from "@/domain/entity/combo";

interface Props {
  params: Promise<{ id: string }>;
}

const AdminPoolCombosPage = async ({ params }: Props) => {
  const { id } = await params;
  const poolXCombos = await fetchPoolXCombos(PoolId(id));
  const unTranslatedCombos = poolXCombos
    .filter((poolXCombo) => comboUnTranslated(poolXCombo.relation))
    .map((poolXCombo) => poolXCombo.relation);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combos"
        subtitle={`${poolXCombos.length} combos`}
        backElement={<BackLink href={`/admin/pools/${id}`} />}
        actions={<TranslateButton combos={unTranslatedCombos} />}
      />
      <Suspense fallback={<LoadingSpinner size="md" />}>
        {poolXCombos.map((poolXCombo) => (
          <ComboSectionCard
            key={poolXCombo.id}
            combo={poolXCombo.relation}
            size="sm"
            footerActions={<TranslateButton combos={[poolXCombo.relation]} />}
          />
        ))}
      </Suspense>
    </div>
  );
};

export default AdminPoolCombosPage;
