import PageHeader from "@/components/ui/PageHeader";
import { fetchPublishedPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import { fetchPoolXCards } from "@/repository/poolXCards";
import CardImage from "@/components/cards/CardImage.client";
import { cardColorIdentity, colorIn, colorsCompare, newCardId } from "@/domain/entity/card";
import CardSearchForm from "@/components/cards/CardSearchForm.client";
import { cardSearchParamsSchema, colorPathList } from "@/components/cards/cardSearchParams";
import { unstable_cache } from "next/cache";
import { PoolId } from "@/domain/entity/pool";
import PageNavigation from "@/app/(user)/PageNavigation";

export const generateStaticParams = async () => {
  return colorPathList().map((c) => ({ c }));
};

interface Props {
  params: Promise<{ c: string }>;
}

const getPoolXCardsCache = unstable_cache(
  async (id: PoolId) => await fetchPoolXCards(id, { commander: false }),
  ["published-pool-x-cards-normals"],
  {
    tags: ["published-pool"],
  },
);

const NormalsPage = async ({ params }: Props) => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }
  const q = cardSearchParamsSchema.parse(await params);

  const poolXCards = await getPoolXCardsCache(current.id)
    .then(async (ps) => {
      return ps.filter((pc) => {
        const colorIdentity = cardColorIdentity(pc.card) ?? [];
        return colorIn(colorIdentity, q.c);
      });
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
      <PageHeader title={`EDH Cube v${current.version} / 一般プール`} />
      <PageNavigation commander combos />
      <CardSearchForm q={q} />
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {poolXCards.map((poolXCard) => (
          <CardImage
            key={newCardId(poolXCard.card.name)}
            card={poolXCard.card}
            href={`/cards/${newCardId(poolXCard.name)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NormalsPage;
