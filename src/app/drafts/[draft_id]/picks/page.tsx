import prisma from "@/lib/prisma";
import Link from "next/link";
import CardGridWithPreview, { type GridCard } from "@/components/CardGridWithPreview";
import ExportPickedList from "@/components/ExportPickedList";
import { getCardImageUrls } from "@/lib/cardImage";

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
    select: { id: true, name: true, set: true, number: true, scryfallJson: true },
  });
  const cardMap = new Map(cardRows.map((c) => [c.id, c] as const));

  function toGridCard(cid: string): GridCard | null {
    const c = cardMap.get(cid);
    if (!c) return null;
    const { normal, large } = getCardImageUrls(c.scryfallJson as unknown);
    const normalUrl = normal ?? "";
    const largeUrl = large ?? normalUrl;
    if (!normalUrl) return null;
    return {
      id: c.id,
      name: c.name,
      set: c.set,
      number: c.number,
      normalUrl,
      largeUrl,
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
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/pools/${poolId}`} className="text-sm underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Picked Cards</h1>
        <div className="ml-auto text-sm opacity-70">Draft ID: {draft.id}</div>
      </div>

      <div className="space-y-8">
        {seatCards.map((sc) => (
          <section
            key={`seat-${sc.seatIndex}`}
            className="border border-black/10 dark:border-white/15 rounded p-3"
          >
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-semibold">Seat{sc.seatIndex + 1}</h2>
              <div className="ml-auto">
                <ExportPickedList cards={sc.cards} seatIndex={sc.seatIndex} />
              </div>
            </div>
            <div className="relative pb-24">
              <CardGridWithPreview cards={sc.cards} perRow={6} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
