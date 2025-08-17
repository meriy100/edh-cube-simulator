import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Canonical route for submitting picks and rotating packs
// POST /api/pools/:id/drafts/:draft_id/picks/:pick_number
// body: { picks: Array<{ seetIndex: number; packId: string; cardIds: string[] }> }
export async function POST(req: NextRequest, ctx: unknown) {
  const { params } = ctx as { params: { id: string; draft_id: string; pick_number: string } };
  const poolId = params.id;
  const draftId = params.draft_id;
  const pickNumberRaw = Number(params.pick_number);
  const pickNumber = Number.isFinite(pickNumberRaw) ? pickNumberRaw : 1;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      picks?: Array<{ seetIndex: number; packId: string; cardIds: string[] }>;
    };
    if (!Array.isArray(body.picks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const draft = await prisma.draft.findFirst({
      where: { id: draftId, poolId },
      select: { id: true, seet: true, packs: true, picks: true },
    });
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const seet = draft.seet;
    const packs = (draft.packs as unknown as Array<{ id: string; cardIds: string[] }>) || [];
    const picks =
      (draft.picks as unknown as Array<Array<{ packId: string; cardIds: string[] }>>) || [];

    // normalize picks array to seet length
    const picksArr: Array<Array<{ packId: string; cardIds: string[] }>> = Array.from(
      { length: seet },
      (_, i) => picks[i] ?? [],
    );

    // Validate that we are within range
    const totalPicks = Math.ceil(packs.length / Math.max(1, seet));
    const pickIdx = Math.min(Math.max(1, pickNumber), Math.max(1, totalPicks));
    const startIndex = (pickIdx - 1) * seet;

    // Build current slice of packs for this pick
    const currentSlice = Array.from({ length: seet }, (_, i) => packs[startIndex + i]).filter(
      Boolean,
    ) as Array<{
      id: string;
      cardIds: string[];
    }>;

    // Map payload by seetIndex for quick access
    const mapBySeat = new Map<number, { packId: string; cardIds: string[] }>();
    for (const p of body.picks) {
      if (
        !p ||
        typeof p.seetIndex !== "number" ||
        typeof p.packId !== "string" ||
        !Array.isArray(p.cardIds) ||
        p.cardIds.length !== 2
      ) {
        return NextResponse.json({ error: "Invalid picks entry" }, { status: 400 });
      }
      mapBySeat.set(p.seetIndex, { packId: p.packId, cardIds: p.cardIds });
    }

    // Append selections per seat
    for (let seat = 0; seat < seet; seat++) {
      const select = mapBySeat.get(seat);
      if (!select) {
        return NextResponse.json({ error: `Missing selection for seat ${seat}` }, { status: 400 });
      }
      // ensure packId matches the pack shown for that seat
      const expectedPack = currentSlice[seat];
      if (expectedPack && expectedPack.id !== select.packId) {
        return NextResponse.json({ error: `packId mismatch for seat ${seat}` }, { status: 400 });
      }
      picksArr[seat] = [
        ...(picksArr[seat] ?? []),
        { packId: select.packId, cardIds: select.cardIds },
      ];
    }

    // Prepare next pick rotation: shift packs for next pick by one seat
    const nextPickIdx = pickIdx + 1;
    const nextStart = (nextPickIdx - 1) * seet;
    const nextWithinRange = nextStart + seet <= packs.length; // can place into next slice

    const updatedPacks = packs.slice();
    if (nextWithinRange) {
      // rotate currentSlice by +1 (pack for seat i goes to seat (i+1) % seet)
      const rotated = currentSlice.map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length]);
      for (let i = 0; i < rotated.length; i++) {
        updatedPacks[nextStart + i] = rotated[i]!;
      }
    }

    await prisma.draft.update({
      where: { id: draftId },
      data: {
        picks: picksArr as unknown as Prisma.InputJsonValue,
        packs: updatedPacks as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, nextPickNumber: pickIdx + 1 });
  } catch (err: unknown) {
    console.error("POST submit picks error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
