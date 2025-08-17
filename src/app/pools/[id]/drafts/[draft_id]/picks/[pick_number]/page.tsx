import prisma from "@/lib/prisma";
import Link from "next/link";

// Server component page to show current pick's packs distributed to each Seet
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
    select: { id: true, poolId: true, seet: true, packs: true, createdAt: true },
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

  const seet = draft.seet;
  const packs = (draft.packs as unknown as Array<{ id: string; cardIds: string[] }>) || [];
  const totalPicks = Math.ceil(packs.length / Math.max(1, seet));

  // Clamp pickNumber to valid range
  const pickIdx = Math.min(Math.max(1, pickNumber), Math.max(1, totalPicks));

  // Compute pack indices for each seet at this pick
  const startIndex = (pickIdx - 1) * seet;
  const packIndices = Array.from({ length: seet }, (_, i) => startIndex + i).filter(
    (idx) => idx >= 0 && idx < packs.length,
  );

  // Gather all card IDs shown on this page
  const cardIdsSet = new Set<string>();
  for (const idx of packIndices) {
    for (const cid of packs[idx]?.cardIds ?? []) {
      cardIdsSet.add(cid);
    }
  }
  const cardIds = Array.from(cardIdsSet);

  // Fetch card details
  const cardRows = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, name: true, set: true, number: true },
  });
  const cardMap = new Map(cardRows.map((c) => [c.id, c] as const));

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/pools/${poolId}`} className="text-sm underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Draft Picks</h1>
        <div className="ml-auto text-sm opacity-70">
          Pick {pickIdx} / {totalPicks}
        </div>
      </div>

      <div className="mb-4 text-sm opacity-70">Draft ID: {draft.id}</div>

      <div className="space-y-6">
        {Array.from({ length: seet }).map((_, seetIndex) => {
          const globalPackIndex = startIndex + seetIndex;
          const pack = packs[globalPackIndex];
          return (
            <section
              key={`seet-${seetIndex}`}
              className="border border-black/10 dark:border-white/15 rounded p-3"
            >
              <h2 className="text-lg font-semibold mb-3">Seet{seetIndex + 1}</h2>
              {!pack ? (
                <div className="text-sm opacity-70">パックなし</div>
              ) : (
                <div className="relative pb-24">
                  {(() => {
                    const perRow = 6;
                    const ids = pack.cardIds || [];
                    const rows = Array.from({ length: Math.ceil(ids.length / perRow) }, (_, r) =>
                      ids.slice(r * perRow, (r + 1) * perRow),
                    );
                    return (
                      <div className="flex flex-col">
                        {rows.map((row, rIdx) => (
                          <div
                            key={`row-${rIdx}`}
                            className={`flex flex-row flex-wrap items-start gap-2 ${rIdx === 0 ? "" : "-mt-24 sm:-mt-28"}`}
                          >
                            {row.map((cid) => {
                              const c = cardMap.get(cid);
                              if (!c) {
                                return (
                                  <div key={cid} className="text-xs opacity-70 p-2 border rounded">
                                    {cid}
                                  </div>
                                );
                              }
                              const imgUrl = `https://api.scryfall.com/cards/${encodeURIComponent(c.set)}/${encodeURIComponent(c.number)}?format=image&version=normal`;
                              return (
                                <div key={cid} className="relative">
                                  <img
                                    src={imgUrl}
                                    alt={`${c.name} (${c.set}) #${c.number}`}
                                    loading="lazy"
                                    className="w-40 sm:w-48 h-auto rounded shadow-sm border border-black/10 dark:border-white/10 bg-white"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
