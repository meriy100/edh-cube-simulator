import PageHeader from "@/components/ui/PageHeader";
import { fetchPublishedPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import { cardSearchParamsSchema, colorPathList } from "@/components/cards/cardSearchParams";
import { fetchPoolXComboCount, fetchPoolXCombosByPage } from "@/repository/poolXCombo";
import { colorIn, colorsCompare } from "@/domain/entity/card";
import CardSearchForm from "@/components/cards/CardSearchForm.client";
import ComboSectionCard from "@/components/combos/ComboSectionCard";
import { unstable_cache } from "next/cache";
import { PoolId } from "@/domain/entity/pool";

export const generateStaticParams = async () => {
  return colorPathList().map((c) => ({ c }));
};

interface Props {
  params: Promise<{ c: string }>;
}

const getPoolXCombosCountCache = unstable_cache(
  async (id: PoolId) => await fetchPoolXComboCount(id),
  ["published-pool-x-combos-count"],
  {
    tags: ["published-pool"],
  },
);

const getPoolXCombosCache = (id: PoolId, page: number) =>
  unstable_cache(
    async () => await fetchPoolXCombosByPage(id, 50, page),
    [`published-pool-x-combos-${page}`],
    {
      tags: ["published-pool"],
    },
  )();

const CombosPage = async ({ params }: Props) => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  const q = cardSearchParamsSchema.parse(await params);

  const count = await getPoolXCombosCountCache(current.id);
  const pageCount = Math.ceil(count / 50);

  const poolXCombos = await Promise.all(
    Array.from({ length: pageCount }, (_, i) => getPoolXCombosCache(current.id, i)),
  )
    .then((p) => p.flat())
    .then(async (ps) => ps.filter((pc) => colorIn(pc.relation.identity, q.c)))
    .then((ps) =>
      ps
        .toSorted((a, b) => a.relation.popularity - b.relation.popularity)
        .toSorted(
          (a, b) => colorsCompare(a.relation.identity) - colorsCompare(b.relation.identity),
        ),
    );
  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version} / コンボ`} />
      <CardSearchForm q={q} />
      {poolXCombos.map((pc) => (
        <ComboSectionCard key={pc.id} combo={pc.relation} size="sm" />
      ))}
    </div>
  );
};

export default CombosPage;
