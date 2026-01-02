import PageHeader from "@/components/ui/PageHeader";
import { fetchPublishedPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import { fetchPoolXCards } from "@/repository/poolXCards";
import CardImage from "@/components/cards/CardImage.client";
import { cardColorIdentity, colorIn, colorsCompare, newCardId } from "@/domain/entity/card";
import CardSearchForm from "@/components/cards/CardSearchForm.client";
import { cardSearchParamsSchema } from "@/components/cards/cardSearchParams";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CommandersPage = async ({ searchParams }: Props) => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }
  const q = cardSearchParamsSchema.safeParse(await searchParams);

  const poolXCards = await fetchPoolXCards(current.id, { commander: true })
    .then(async (ps) => {
      if (!q.success) {
        return ps;
      }
      if (q.data.c !== undefined) {
        return ps.filter((pc) => {
          const colorIdentity = cardColorIdentity(pc.card) ?? [];
          return colorIn(colorIdentity, q.data.c!);
        });
      }
      return ps;
    })
    .then((ps) =>
      ps
        .toSorted((a, b) => a.card.cmc - b.card.cmc)
        .toSorted(
          (a, b) =>
            colorsCompare(cardColorIdentity(a.card) ?? []) -
            colorsCompare(cardColorIdentity(b.card) ?? []),
        ),
    );

  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version} / 統率者`} />
      <CardSearchForm q={q.data ?? {}} />
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {poolXCards.map((poolXCard) => (
          <CardImage key={newCardId(poolXCard.card.name)} card={poolXCard.card} />
        ))}
      </div>
    </div>
  );
};

export default CommandersPage;
