import prisma from "@/lib/prisma";
import Link from "next/link";
import { type GridCard } from "@/components/CardGridWithPreview";
import DraftPickClient, { type SeatPack } from "@/components/DraftPickClient";

// Server component page to show current pick's packs distributed to each Seat
// Route: /pools/[id]/drafts/[draft_id]/picks/[pick_number]
export default async function DraftPickPage({
  params,
}: {
  params: { id: string; draft_id: string; pick_number: string };
}) {
  const poolId = params.id;
  const draftId = params.draft_id;
  const pickNumberRaw = Number(params.pick_number);
  const pickNumber = Number.isFinite(pickNumberRaw) ? pickNumberRaw : 1;

  const draft = await prisma.draft.findFirst({
    where: { id: draftId, poolId },
    select: { id: true, poolId: true, seat: true, packs: true, picks: true, createdAt: true },
  });

  if (!draft) {
    return (
      <div className="p-6">
        <div className="mb-3 text-sm opacity-70">
          <Link href={`/pools/${poolId}`} className="underline">
            ← Back to pool
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Draft not found</h1>
      </div>
    );
  }

  const seat = draft.seat;
  const packs = (draft.packs as unknown as Array<{ id: string; cardIds: string[] }>) || [];

  // Total number of pack slices (how many distinct sets of packs exist per seat)
  const totalSlices = Math.ceil(packs.length / Math.max(1, seat));

  // Display total picks = picks per pack * number of packs per seat
  // picks per pack = ceil(pack size / picksPerPick). picksPerPick is 2.
  const picksPerPick = 2;
  const packSize = Math.max(0, packs[0]?.cardIds?.length ?? 0);
  const picksPerPack = Math.ceil(packSize / picksPerPick);
  const displayTotalPicks = totalSlices * Math.max(1, picksPerPack);

  // Clamp the logical pick number to the displayable total, then map to slice index
  const clampedDisplayPickNumber = Math.min(
    Math.max(1, pickNumber),
    Math.max(1, displayTotalPicks),
  );
  const pickIdx = Math.ceil(clampedDisplayPickNumber / Math.max(1, picksPerPack));

  // Compute pack indices for each seat at this pick (slice)
  const startIndex = (pickIdx - 1) * seat;
  const packIndices = Array.from({ length: seat }, (_, i) => startIndex + i).filter(
    (idx) => idx >= 0 && idx < packs.length,
  );

  // Build map of already-picked card IDs per packId up to previous picks
  const picks =
    (draft.picks as unknown as Array<Array<{ packId: string; cardIds: string[] }>>) || [];
  const pickedByPack = new Map<string, Set<string>>();
  for (let seatIndex = 0; seatIndex < seat; seatIndex++) {
    const seatPicks = picks[seatIndex] ?? [];
    // Use clamped logical pick number to determine how many previous picks to exclude.
    const upto = Math.min(seatPicks.length, Math.max(0, clampedDisplayPickNumber - 1));
    for (let i = 0; i < upto; i++) {
      const entry = seatPicks[i];
      if (!entry) continue;
      const set = pickedByPack.get(entry.packId) ?? new Set<string>();
      for (const cid of entry.cardIds ?? []) set.add(cid);
      pickedByPack.set(entry.packId, set);
    }
  }

  // Gather all remaining card IDs shown on this page (exclude previously picked ones)
  const cardIdsSet = new Set<string>();
  for (const idx of packIndices) {
    const pack = packs[idx];
    if (!pack) continue;
    const removed = pickedByPack.get(pack.id);
    for (const cid of pack.cardIds ?? []) {
      if (!removed || !removed.has(cid)) cardIdsSet.add(cid);
    }
  }
  const cardIds = Array.from(cardIdsSet);

  // Fetch card details
  const cardRows = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, name: true, set: true, number: true, scryfallJson: true },
  });
  const cardMap = new Map(cardRows.map((c) => [c.id, c] as const));

  const seatPacks: SeatPack[] = Array.from({ length: seat })
    .map((_, seatIndex) => {
      const globalPackIndex = startIndex + seatIndex;
      const pack = packs[globalPackIndex];
      if (!pack) return null;
      const removed = pickedByPack.get(pack.id);
      const ids = (pack.cardIds || []).filter((cid) => !removed || !removed.has(cid));
      const cards: GridCard[] = ids
        .map((cid) => {
          const c = cardMap.get(cid);
          if (!c) return null;
          const normalUrl = `https://api.scryfall.com/cards/${encodeURIComponent(c.set)}/${encodeURIComponent(c.number)}?format=image&version=normal`;
          let largeUrl = normalUrl;
          try {
            const sf = c.scryfallJson as unknown as { image_uris?: { large?: string } };
            const lu = sf?.image_uris?.large as string | undefined;
            if (lu && typeof lu === "string") {
              largeUrl = lu;
            } else {
              largeUrl = `https://api.scryfall.com/cards/${encodeURIComponent(c.set)}/${encodeURIComponent(c.number)}?format=image&version=large`;
            }
          } catch {
            largeUrl = `https://api.scryfall.com/cards/${encodeURIComponent(c.set)}/${encodeURIComponent(c.number)}?format=image&version=large`;
          }
          return {
            id: c.id,
            name: c.name,
            set: c.set,
            number: c.number,
            normalUrl,
            largeUrl,
          } satisfies GridCard;
        })
        .filter((x): x is GridCard => !!x);
      return { seatIndex, packId: pack.id, cards } as SeatPack;
    })
    .filter((x): x is SeatPack => !!x);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/pools/${poolId}`} className="text-sm underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Draft Picks</h1>
        <div className="ml-auto text-sm opacity-70">
          {(() => {
            return `Pick ${clampedDisplayPickNumber} / ${displayTotalPicks}`;
          })()}
        </div>
      </div>

      <div className="mb-4 text-sm opacity-70">Draft ID: {draft.id}</div>

      <DraftPickClient
        poolId={poolId}
        draftId={draftId}
        pickNumber={clampedDisplayPickNumber}
        seatPacks={seatPacks}
      />
    </div>
  );
}
