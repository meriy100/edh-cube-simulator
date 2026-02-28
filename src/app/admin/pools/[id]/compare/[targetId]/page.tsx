import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { PoolId } from "@/domain/entity/pool";
import CardImage from "@/components/cards/CardImage.client";
import { fetchPool } from "@/repository/pools";
import { fetchPoolXCards } from "@/repository/poolXCards";
import Alert from "@/components/ui/Alert.client";
import BackLink from "@/components/ui/BackLink.client";
import { fetchPoolXCombos } from "@/repository/poolXCombo";
import ComboSectionCard from "@/components/combos/ComboSectionCard";
import { newCardId } from "@/domain/entity/card";

interface Props {
    params: Promise<{ id: string; targetId: string }>;
}

const AdminPoolComparePage = async ({ params }: Props) => {
    const { id, targetId } = await params;

    const basePool = await fetchPool(PoolId(id));
    const targetPool = await fetchPool(PoolId(targetId));

    if (!basePool || !targetPool) {
        return <Alert variant="error">Pool not found</Alert>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Compare Pools"
                subtitle={`Comparing Version ${basePool.version || basePool.id} with Version ${targetPool.version || targetPool.id}`}
                backElement={<BackLink href={`/admin/pools/${id}`} />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: What's in Target Pool, but not in Base Pool */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2">
                        Only in {targetPool.version || targetPool.id}
                    </h2>

                    <SectionCard title="Commander cards">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(targetId)}
                                secondaryPoolId={PoolId(id)}
                                commander={true}
                                outside={false}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="Normal cards">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(targetId)}
                                secondaryPoolId={PoolId(id)}
                                commander={false}
                                outside={false}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="その他カード">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(targetId)}
                                secondaryPoolId={PoolId(id)}
                                outside={true}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="Combos">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXComboList
                                primaryPoolId={PoolId(targetId)}
                                secondaryPoolId={PoolId(id)}
                            />
                        </Suspense>
                    </SectionCard>
                </div>

                {/* Right Column: What's in Base Pool, but not in Target Pool */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2">
                        Only in {basePool.version || basePool.id}
                    </h2>

                    <SectionCard title="Commander cards">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(id)}
                                secondaryPoolId={PoolId(targetId)}
                                commander={true}
                                outside={false}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="Normal cards">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(id)}
                                secondaryPoolId={PoolId(targetId)}
                                commander={false}
                                outside={false}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="その他カード">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXCardGrid
                                primaryPoolId={PoolId(id)}
                                secondaryPoolId={PoolId(targetId)}
                                outside={true}
                            />
                        </Suspense>
                    </SectionCard>

                    <SectionCard title="Combos">
                        <Suspense fallback={<LoadingSpinner size="md" />}>
                            <ComparePoolXComboList
                                primaryPoolId={PoolId(id)}
                                secondaryPoolId={PoolId(targetId)}
                            />
                        </Suspense>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default AdminPoolComparePage;

const ComparePoolXCardGrid = async ({
    primaryPoolId,
    secondaryPoolId,
    commander,
    outside,
}: {
    primaryPoolId: PoolId;
    secondaryPoolId: PoolId;
    commander?: boolean;
    outside?: boolean;
}) => {
    const [primaryCards, secondaryCards] = await Promise.all([
        fetchPoolXCards(primaryPoolId, { commander, outside }),
        fetchPoolXCards(secondaryPoolId, { commander, outside }),
    ]);

    const secondaryNames = new Set(secondaryCards.map((c) => c.name));
    const diffCards = primaryCards.filter((c) => !secondaryNames.has(c.name));

    if (diffCards.length === 0) {
        return <p className="text-gray-500 text-sm italic py-4">No differences found.</p>;
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {diffCards.map((poolXCard) => (
                <CardImage
                    key={poolXCard.name}
                    card={poolXCard.card}
                    href={`/admin/cards/${newCardId(poolXCard.name)}`}
                />
            ))}
        </div>
    );
};

const ComparePoolXComboList = async ({
    primaryPoolId,
    secondaryPoolId,
}: {
    primaryPoolId: PoolId;
    secondaryPoolId: PoolId;
}) => {
    const [primaryCombos, secondaryCombos] = await Promise.all([
        fetchPoolXCombos(primaryPoolId),
        fetchPoolXCombos(secondaryPoolId),
    ]);

    const secondaryIds = new Set(secondaryCombos.map((c) => c.id));
    const diffCombos = primaryCombos.filter((c) => !secondaryIds.has(c.id));

    if (diffCombos.length === 0) {
        return <p className="text-gray-500 text-sm italic py-4">No differences found.</p>;
    }

    return (
        <div className="space-y-4">
            {diffCombos.map((poolXCombo) => (
                <ComboSectionCard
                    key={poolXCombo.id}
                    combo={poolXCombo.relation}
                    size="sm"
                    cardPathFactory={(id) => `/admin/cards/${id}`}
                />
            ))}
        </div>
    );
};
