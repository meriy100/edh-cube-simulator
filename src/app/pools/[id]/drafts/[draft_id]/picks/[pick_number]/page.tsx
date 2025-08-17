import prisma from "@/lib/prisma";
import Link from "next/link";
import { type GridCard } from "@/components/CardGridWithPreview";
import DraftPickClient, { type SeatPack } from "@/components/DraftPickClient";

// Server component page to show current pick's packs distributed to each Seat
// Route: /pools/[id]/drafts/[draft_id]/picks/[pick_number]
export default async function DraftPickPage({
  params,
}: {
  params: Promise<{ id: string; draft_id: string; pick_number: string }>;
}) {
  const { id: poolId, draft_id: draftId, pick_number } = await params;
  const pickNumberRaw = Number(pick_number);
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
  const remainingIdsSet = new Set<string>();
  for (const idx of packIndices) {
    const pack = packs[idx];
    if (!pack) continue;
    const removed = pickedByPack.get(pack.id);
    for (const cid of pack.cardIds ?? []) {
      if (!removed || !removed.has(cid)) remainingIdsSet.add(cid);
    }
  }

  // Collect picked-so-far card IDs per seat (up to previous pick)
  const pickedIdsPerSeat: string[][] = Array.from({ length: seat }, (_, seatIndex) => {
    const seatPicks = picks[seatIndex] ?? [];
    const upto = Math.min(seatPicks.length, Math.max(0, clampedDisplayPickNumber - 1));
    const ids: string[] = [];
    for (let i = 0; i < upto; i++) {
      const entry = seatPicks[i];
      if (!entry) continue;
      for (const cid of entry.cardIds ?? []) ids.push(cid);
    }
    return ids;
  });

  // Union of all needed IDs (remaining + picked-so-far)
  const allIdsSet = new Set<string>([...remainingIdsSet]);
  for (const ids of pickedIdsPerSeat) for (const id of ids) allIdsSet.add(id);
  const allIds = Array.from(allIdsSet);

  // Fetch card details for all needed IDs once
  const cardRows = await prisma.card.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, set: true, number: true, scryfallJson: true },
  });
  const cardMap = new Map(cardRows.map((c) => [c.id, c] as const));

  function toGridCardById(cid: string): GridCard | null {
    const c = cardMap.get(cid);
    if (!c) return null;
    // Extract image URLs from stored scryfallJson (avoid using Scryfall API endpoints)
    let normalUrl = "";
    let largeUrl = "";
    try {
      const j = c.scryfallJson as unknown;
      const get = (obj: unknown, key: "normal" | "large"): string | undefined => {
        if (!obj || typeof obj !== "object") return undefined;
        const o = obj as {
          image_uris?: { normal?: string; large?: string };
          card_faces?: Array<{ image_uris?: { normal?: string; large?: string } }>;
        };
        return (
          o.image_uris?.[key] ||
          (Array.isArray(o.card_faces) ? o.card_faces[0]?.image_uris?.[key] : undefined)
        );
      };
      normalUrl = get(j, "normal") ?? "";
      largeUrl = get(j, "large") ?? normalUrl;
    } catch {
      normalUrl = "";
      largeUrl = "";
    }
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

  // Determine if this pick is completed (all seats have a pick recorded for this pick number)
  const isCompletedPick = Array.from(
    { length: seat },
    (_, idx) => (picks[idx]?.length ?? 0) >= clampedDisplayPickNumber,
  ).every(Boolean);

  const seatPacks: SeatPack[] = Array.from({ length: seat })
    .map((_, seatIndex) => {
      let packId: string | undefined;
      let pack: { id: string; cardIds: string[] } | undefined;

      let pickedThisPickIds: string[] | undefined;
      if (isCompletedPick) {
        // Use the historical packId used at this pick for this seat
        const entry = (picks[seatIndex] ?? [])[clampedDisplayPickNumber - 1];
        packId = entry?.packId;
        pickedThisPickIds = entry?.cardIds ?? [];
        if (packId) pack = packs.find((p) => p.id === packId);
      } else {
        // Use the current slice mapping for ongoing/future picks
        const globalPackIndex = startIndex + seatIndex;
        pack = packs[globalPackIndex];
        packId = pack?.id;
      }

      if (!pack || !packId) return null;

      const removed = pickedByPack.get(packId);
      const ids = (pack.cardIds || []).filter((cid) => !removed || !removed.has(cid));
      const cards: GridCard[] = ids.map(toGridCardById).filter((x): x is GridCard => !!x);
      const pickedIds = pickedIdsPerSeat[seatIndex] ?? [];
      const pickedCards: GridCard[] = pickedIds
        .map(toGridCardById)
        .filter((x): x is GridCard => !!x);
      return { seatIndex, packId, cards, pickedCards, pickedThisPickIds } as SeatPack;
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
        isPickCompleted={Array.from(
          { length: seat },
          (_, idx) => (picks[idx]?.length ?? 0) >= clampedDisplayPickNumber,
        ).every(Boolean)}
      />
    </div>
  );
}
