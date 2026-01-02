import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchCard } from "@/repository/cards";
import CardImage from "@/components/cards/CardImage.client";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import RefetchScryfallButton from "@/app/admin/cards/[id]/RefetchScryfallButton.client";
import InfoDisplay from "@/components/ui/InfoDisplay";
import {
  cardColorIdentity,
  cardNameJa,
  cardOracle,
  cardOracleBack,
  cardOracleFront,
  isCardMultiFaces,
} from "@/domain/entity/card";
import { fetchCombos } from "@/repository/combos";
import ComboSectionCard from "@/components/combos/ComboSectionCard";

interface Props {
  params: Promise<{ id: string }>;
}
const AdminCardShowPage = async ({ params }: Props) => {
  const { id } = await params;
  const card = await fetchCard(id);
  const combos = await fetchCombos({ cardName: card.name });

  return (
    <div className="space-y-6">
      <PageHeader title={cardNameJa(card)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SectionCard title="カード画像">
            <CardImage card={card} />
          </SectionCard>

          {card.originalImageBackUrl && (
            <SectionCard title="裏面画像">
              <CardImage card={card} back />
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="基本情報">
            <InfoDisplay label="ManaValue">{card.cmc}</InfoDisplay>
            <InfoDisplay label="Type">{card.type}</InfoDisplay>
            <InfoDisplay label="Color Identity">
              {cardColorIdentity(card) ? (
                <ColorIdentityBadges colorIdentity={cardColorIdentity(card) ?? []} />
              ) : null}
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
          {combos.map((combo) => (
            <ComboSectionCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCardShowPage;
