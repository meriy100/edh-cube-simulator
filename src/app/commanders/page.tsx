import PageHeader from "@/components/ui/PageHeader";
import { fetchPools } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import { fetchPoolXCards } from "@/repository/poolXCards";
import CardImage from "@/components/cards/CardImage.client";
import { cardColorIdentity, colorsSortFn, newCardId } from "@/domain/entity/card";

const CommandersPage = async () => {
  const pools = await fetchPools({ published: true });
  const current = pools[0];

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  const poolXCards = await fetchPoolXCards(current.id, { commander: true }).then((cards) =>
    cards.toSorted(
      (a, b) =>
        colorsSortFn(cardColorIdentity(a.card) ?? []) -
        colorsSortFn(cardColorIdentity(b.card) ?? []),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version} / 統率者`} />
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {poolXCards.map((poolXCard) => (
          <CardImage key={newCardId(poolXCard.card.name)} card={poolXCard.card} />
        ))}
      </div>
    </div>
  );
};

export default CommandersPage;
