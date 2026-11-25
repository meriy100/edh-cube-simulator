import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert.client";
import { fetchPublishedPool } from "@/repository/pools";
import { fetchPoolXCards } from "@/repository/poolXCards";
import { unstable_cache } from "next/cache";
import { PoolId } from "@/domain/entity/pool";
import { cardImageUrl, cardNameJa, newCardId } from "@/domain/entity/card";
import CardScanner, { ScanPoolCard } from "@/app/admin/scan/CardScanner.client";

const getPoolXCardsCache = unstable_cache(
  async (id: PoolId) => await fetchPoolXCards(id),
  ["published-pool-x-cards-all"],
  { tags: ["published-pool"] },
);

const ScanPage = async () => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  const poolXCards = await getPoolXCardsCache(current.id);

  const cards: ScanPoolCard[] = poolXCards.flatMap((pc) => {
    const imageUrl = cardImageUrl(pc.card);
    // References use Scryfall's 146x204 "small" image of the printing shown in the app.
    if (!imageUrl?.includes("cards.scryfall.io")) return [];
    return [
      {
        id: newCardId(pc.name),
        name: pc.name,
        nameJa: cardNameJa(pc.card),
        imageUrl: imageUrl.replace(/\/(large|normal|png)\//, "/small/"),
      },
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`EDH Cube v${current.version} / カード認識（試験中）`}
        subtitle="写真に写ったカードを端末内で認識します。画像は外部に送信されません。"
      />
      <CardScanner cards={cards} />
    </div>
  );
};

export default ScanPage;
