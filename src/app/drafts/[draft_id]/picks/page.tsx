import prisma from "@/lib/prisma";
import { type GridCard } from "@/components/CardGridWithPreview";
import ExportPickedList from "@/components/ExportPickedList";
import PickedBoard from "@/components/PickedBoard";
import { getCardImageUrls } from "@/lib/cardImage";
import { getCardTypes } from "@/lib/cardTypes";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

// Server component page to show picked cards per seat
// New Route: /drafts/[draft_id]/picks
export default async function DraftPicksPage({
  params,
}: {
  params: Promise<{ draft_id: string }>;
}) {
  const { draft_id: draftId } = await params;

  const draft = await prisma.draft.findFirst({
    where: { id: draftId },
    select: { id: true, poolId: true, seat: true, picks: true },
  });

  if (!draft) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Draft not found</h1>
      </div>
    );
  }

  const poolId = draft.poolId;
  const seat = draft.seat;
  const picks =
    (draft.picks as unknown as Array<Array<{ packId: string; cardIds: string[] }>>) || [];

  // Collect all picked card IDs per seat
  const pickedIdsPerSeat: string[][] = Array.from({ length: seat }, (_, i) => {
    const seatPicks = picks[i] ?? [];
    const ids: string[] = [];
    for (const p of seatPicks) {
      for (const cid of p.cardIds ?? []) ids.push(cid);
    }
    return ids;
  });

  // Flatten and fetch card details
  const allIds = Array.from(new Set(pickedIdsPerSeat.flat()));
  const cardRows = await prisma.card.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, set: true, number: true, scryfallJson: true, cubeCobra: true },
  });
  const cardMap = new Map(cardRows.map((c) => [c.id, c] as const));

  function getManaValueFromScryfall(json: unknown): number {
    try {
      if (json && typeof json === "object") {
        const obj = json as Record<string, unknown>;
        const mvRaw = (obj.mana_value as unknown) ?? (obj.cmc as unknown);
        if (typeof mvRaw === "number" && Number.isFinite(mvRaw)) {
          return Math.floor(Math.max(0, mvRaw));
        }
      }
    } catch {}
    return 0;
  }

  function toGridCard(cid: string): GridCard | null {
    const c = cardMap.get(cid);
    if (!c) return null;
    const { normal, large } = getCardImageUrls(c.scryfallJson as unknown, c.cubeCobra as unknown);
    const normalUrl = normal ?? "";
    const largeUrl = large ?? normalUrl;
    if (!normalUrl) return null;
    const types = getCardTypes(c as unknown as { scryfallJson?: unknown | null });
    const manaValue = getManaValueFromScryfall(c.scryfallJson as unknown);
    return {
      id: c.id,
      name: c.name,
      set: c.set,
      number: c.number,
      normalUrl,
      largeUrl,
      types,
      manaValue,
    } satisfies GridCard;
  }

  const seatCards: { seatIndex: number; cards: GridCard[] }[] = Array.from({ length: seat }).map(
    (_, seatIndex) => {
      const ids = pickedIdsPerSeat[seatIndex] ?? [];
      const cards = ids.map(toGridCard).filter((x): x is GridCard => !!x);
      return { seatIndex, cards };
    },
  );

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <PageHeader
        title="Picked Cards"
        subtitle={`Draft ID: ${draft.id}`}
        backElement={<BackLink href={`/pools/${poolId}`} />}
      />

      <div className="space-y-8">
        {seatCards.map((sc) => (
          <SectionCard
            key={`seat-${sc.seatIndex}`}
            title={`Seat${sc.seatIndex + 1}`}
            actions={
              <ExportPickedList draftId={draftId} cards={sc.cards} seatIndex={sc.seatIndex} />
            }
          >
            <PickedBoard draftId={draftId} seatIndex={sc.seatIndex} pickedCards={sc.cards} />
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
