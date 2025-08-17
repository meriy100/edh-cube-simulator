import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Canonical route for submitting picks and rotating packs
// POST /api/pools/:id/drafts/:draft_id/picks/:pick_number
// body: { picks: Array<{ seatIndex: number; packId: string; cardIds: string[] }> }
export async function POST(req: NextRequest, ctx: unknown) {
  const { params } = ctx as { params: { id: string; draft_id: string; pick_number: string } };
  const poolId = params.id;
  const draftId = params.draft_id;
  const pickNumberRaw = Number(params.pick_number);
  const pickNumber = Number.isFinite(pickNumberRaw) ? pickNumberRaw : 1;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      picks?: Array<{ seatIndex: number; packId: string; cardIds: string[] }>;
    };
    if (!Array.isArray(body.picks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const draft = await prisma.draft.findFirst({
      where: { id: draftId, poolId },
      select: { id: true, seat: true, packs: true, picks: true },
    });
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const seat = draft.seat;
    const packs = (draft.packs as unknown as Array<{ id: string; cardIds: string[] }>) || [];
    const picks =
      (draft.picks as unknown as Array<Array<{ packId: string; cardIds: string[] }>>) || [];

    // normalize picks array to seat length
    const picksArr: Array<Array<{ packId: string; cardIds: string[] }>> = Array.from(
      { length: seat },
      (_, i) => picks[i] ?? [],
    );

    // Compute totals similar to the frontend logic
    const totalSlices = Math.ceil(packs.length / Math.max(1, seat));
    const picksPerPick = 2; // number of cards picked at once
    const packSize = Math.max(0, packs[0]?.cardIds?.length ?? 0);
    const picksPerPack = Math.ceil(packSize / picksPerPick);
    const totalPicks = totalSlices * Math.max(1, picksPerPack);

    // Map the incoming pickNumber to the slice index used for pack rotation
    const clampedPickNumber = Math.min(Math.max(1, pickNumber), Math.max(0, totalPicks));
    const pickIdx = Math.ceil(clampedPickNumber / Math.max(1, picksPerPack)); // 1..totalSlices
    const startIndex = (pickIdx - 1) * seat;

    // Build current slice of packs for this pick
    const currentSlice = Array.from({ length: seat }, (_, i) => packs[startIndex + i]).filter(
      Boolean,
    ) as Array<{
      id: string;
      cardIds: string[];
    }>;

    // Map payload by seatIndex for quick access
    const mapBySeat = new Map<number, { packId: string; cardIds: string[] }>();
    for (const p of body.picks) {
      if (
        !p ||
        typeof p.seatIndex !== "number" ||
        typeof p.packId !== "string" ||
        !Array.isArray(p.cardIds) ||
        p.cardIds.length !== 2
      ) {
        return NextResponse.json({ error: "Invalid picks entry" }, { status: 400 });
      }
      mapBySeat.set(p.seatIndex, { packId: p.packId, cardIds: p.cardIds });
    }

    // Append selections per seat
    for (let seatIndex = 0; seatIndex < seat; seatIndex++) {
      const select = mapBySeat.get(seatIndex);
      if (!select) {
        return NextResponse.json(
          { error: `Missing selection for seat ${seatIndex}` },
          { status: 400 },
        );
      }
      // ensure packId matches the pack shown for that seat
      const expectedPack = currentSlice[seatIndex];
      if (expectedPack && expectedPack.id !== select.packId) {
        return NextResponse.json(
          { error: `packId mismatch for seat ${seatIndex}` },
          { status: 400 },
        );
      }
      picksArr[seatIndex] = [
        ...(picksArr[seatIndex] ?? []),
        { packId: select.packId, cardIds: select.cardIds },
      ];
    }

    // Prepare next pick rotation: shift packs for next pick by one seat
    // Determine the slice index for the next pick number (advances slice after finishing a pack)
    const nextPickNumber = pickNumber + 1;
    const nextClampedPickNumber = Math.min(Math.max(1, nextPickNumber), Math.max(0, totalPicks));
    const nextPickIdx = Math.ceil(nextClampedPickNumber / Math.max(1, picksPerPack)); // 1..totalSlices
    const nextStart = (nextPickIdx - 1) * seat;
    const nextWithinRange = nextStart + seat <= packs.length; // can place into next slice

    const updatedPacks = packs.slice();
    // Rotate packs either into the next slice (if it exists) or within the current slice to continue drafting
    const rotated = currentSlice.map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length]);
    const targetStart = nextWithinRange ? nextStart : startIndex;
    for (let i = 0; i < rotated.length; i++) {
      updatedPacks[targetStart + i] = rotated[i]!;
    }

    await prisma.draft.update({
      where: { id: draftId },
      data: {
        picks: picksArr as unknown as Prisma.InputJsonValue,
        packs: updatedPacks as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    // Return the logical next pick number (not the slice index)
    return NextResponse.json({ ok: true, nextPickNumber });
  } catch (err: unknown) {
    console.error("POST submit picks error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
