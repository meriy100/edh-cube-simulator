import PageHeader from "@/components/ui/PageHeader";
import { fetchPools, fetchPublishedPool } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown } from "lucide-react";
import Link from "next/link";
import { cardSearchParamsSchema } from "@/components/cards/cardSearchParams";
import { fetchPoolXCombos } from "@/repository/poolXCombo";
import { cardColorIdentity, colorIn, colorsCompare } from "@/domain/entity/card";
import CardSearchForm from "@/components/cards/CardSearchForm.client";
import ComboSectionCard from "@/components/combos/ComboSectionCard";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CombosPage = async ({ searchParams }: Props) => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  const q = cardSearchParamsSchema.safeParse(await searchParams);

  const poolXCombos = await fetchPoolXCombos(current.id)
    .then(async (ps) => {
      if (!q.success) {
        return ps;
      }
      if (q.data.c !== undefined) {
        return ps.filter((pc) => {
          return colorIn(pc.relation.identity, q.data.c!);
        });
      }
      return ps;
    })
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
      <CardSearchForm q={q.data ?? {}} />
      {poolXCombos.map((pc) => (
        <ComboSectionCard key={pc.id} combo={pc.relation} size="sm" />
      ))}
    </div>
  );
};

export default CombosPage;
