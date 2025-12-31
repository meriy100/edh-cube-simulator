import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchCard } from "@/repository/cards";
import CardImage from "@/components/cards/CardImage.client";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import RefetchScryfallButton from "@/app/admin/cards/[id]/RefetchScryfallButton.client";
import InfoDisplay from "@/components/ui/InfoDisplay";
import {
  cardIdentity,
  cardNameJa,
  cardOracle,
  cardOracleBack,
  cardOracleFront,
  isCardMultiFaces,
} from "@/domain/entity/card";

interface Props {
  params: Promise<{ id: string }>;
}
const AdminCardShowPage = async ({ params }: Props) => {
  const { id } = await params;
  const card = await fetchCard(id);

  return (
    <div className="space-y-6">
      <PageHeader title={cardNameJa(card)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SectionCard title="カード画像">
            <div className="relative bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: "63/88" }}>
              {card.originalImageUrl ? (
                <CardImage imageUrl={card.originalImageUrl} name={card.name} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  画像が利用できません
                </div>
              )}
            </div>
          </SectionCard>

          {card.originalImageBackUrl && (
            <SectionCard title="裏面画像">
              <div
                className="relative bg-gray-200 dark:bg-gray-700"
                style={{ aspectRatio: "63/88" }}
              >
                <CardImage imageUrl={card.originalImageBackUrl} name={`${card.name} (裏面)`} />
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="基本情報">
            <InfoDisplay label="ManaValue">{card.cmc}</InfoDisplay>
            <InfoDisplay label="Type">{card.type}</InfoDisplay>
            <InfoDisplay label="Color Identity">
              <ColorIdentityBadges colorIdentity={cardIdentity(card) ?? []} />
            </InfoDisplay>
            <InfoDisplay label="Oracle">
              {isCardMultiFaces(card) ? cardOracleFront(card) : cardOracle(card)}
            </InfoDisplay>
            <div className="flex justify-end">
              <RefetchScryfallButton name={card.name} />
            </div>
          </SectionCard>
          {isCardMultiFaces(card) ? (
            <SectionCard title="第2面">
              <InfoDisplay label="Oracle">{cardOracleBack(card)}</InfoDisplay>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminCardShowPage;
