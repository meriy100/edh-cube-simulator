import { fetchPublishedPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import PageHeader from "@/components/ui/PageHeader";
import PageNavigation from "@/app/(user)/PageNavigation";
import { unstable_cache } from "next/cache";
import { PoolId } from "@/domain/entity/pool";
import { fetchPoolXCard, fetchPoolXCards } from "@/repository/poolXCards";
import { fetchPoolXCombos } from "@/repository/poolXCombo";
import SectionCard from "@/components/ui/SectionCard";
import InfoDisplay from "@/components/ui/InfoDisplay";
import {
  cardColorIdentity,
  cardOracle,
  cardOracleBack,
  cardOracleFront,
  isCardMultiFaces,
  newCardId,
} from "@/domain/entity/card";
import CardImage from "@/components/cards/CardImage.client";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import ComboSectionCard from "@/components/combos/ComboSectionCard";

export const generateStaticParams = async () => {
  const pool = await fetchPublishedPool();
  if (!pool) {
    return [];
  }
  const poolXCards = await fetchPoolXCards(pool.id);

  return poolXCards.map((pc) => ({ id: newCardId(pc.name) }));
};

const getCardCache = async (poolId: PoolId, id: string) =>
  unstable_cache(
    async () => {
      return await fetchPoolXCard(poolId, id);
    },
    [`published-pool-x-card-${id}`],
    {
      tags: ["published-pool"],
    },
  )();

const getCombosCache = async (poolId: PoolId, cardName: string) =>
  unstable_cache(
    async () => {
      return await fetchPoolXCombos(poolId, { cardName });
    },
    [`published-combos-${cardName}`],
    {
      tags: ["published-pool"],
    },
  )();

interface Props {
  params: Promise<{ id: string }>;
}

const CardPage = async ({ params }: Props) => {
  const { id } = await params;
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  const poolXCard = await getCardCache(current.id, id);
  if (!poolXCard) {
    return <Alert variant="error">Not found card</Alert>;
  }

  const poolXCombos = await getCombosCache(current.id, poolXCard.name);

  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version} / ${poolXCard.name}`} />
      <PageNavigation commander normals combos />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SectionCard title="カード画像">
            <CardImage card={poolXCard.card} />
          </SectionCard>

          {isCardMultiFaces(poolXCard.card) && (
            <SectionCard title="裏面画像">
              <CardImage card={poolXCard.card} back />
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="基本情報">
            <InfoDisplay label="ManaValue">{poolXCard.card.cmc}</InfoDisplay>
            <InfoDisplay label="Type">{poolXCard.card.type}</InfoDisplay>
            <InfoDisplay label="Color Identity">
              {cardColorIdentity(poolXCard.card) ? (
                <ColorIdentityBadges colorIdentity={cardColorIdentity(poolXCard.card) ?? []} />
              ) : null}
            </InfoDisplay>
            <InfoDisplay label="Oracle">
              {isCardMultiFaces(poolXCard.card)
                ? cardOracleFront(poolXCard.card)
                : cardOracle(poolXCard.card)}
            </InfoDisplay>
          </SectionCard>
          {isCardMultiFaces(poolXCard.card) ? (
            <SectionCard title="第2面">
              <InfoDisplay label="Oracle">{cardOracleBack(poolXCard.card)}</InfoDisplay>
            </SectionCard>
          ) : null}
          {poolXCombos.map((poolXCombo) => (
            <ComboSectionCard
              key={poolXCombo.id}
              combo={poolXCombo.relation}
              size="sm"
              cardPathFactory={(id) => `/cards/${id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardPage;
