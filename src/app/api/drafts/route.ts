import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/drafts
// Returns latest 15 drafts with pool info
export async function GET() {
  try {
    const drafts = await prisma.draft.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        createdAt: true,
        seat: true,
        pool: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json({ drafts });
  } catch (err: unknown) {
    console.error("GET /api/drafts error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/drafts
// body: { pool_id: string; seat?: number }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      pool_id?: string;
      poolId?: string;
      seat?: number;
    };
    const poolId = (body.pool_id || body.poolId || "").trim();
    const seatRaw = body?.seat;
    const seat = Number.isFinite(seatRaw as unknown as number) ? (seatRaw as unknown as number) : 8;

    if (!poolId) {
      return NextResponse.json({ error: "pool_id is required" }, { status: 400 });
    }
    if (seat <= 0) {
      return NextResponse.json({ error: "seat must be positive" }, { status: 400 });
    }

    // Load pool with tags and card ids
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: {
        id: true,
        poolCards: {
          select: {
            count: true,
            tags: true,
            card: { select: { id: true } },
          },
        },
      },
    });
    if (!pool) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Build candidate lists (exclude welcome set for others)
    const commanderCandidates: string[] = [];
    const otherCandidates: string[] = [];

    for (const pc of pool.poolCards) {
      const isCommander = (pc.tags || []).some((t) => t.startsWith("#0-commander"));
      const isWelcome = (pc.tags || []).some((t) => t.startsWith("#9-welcome-set"));
      if (isCommander) {
        commanderCandidates.push(pc.card.id);
      } else if (!isWelcome) {
        otherCandidates.push(pc.card.id);
      }
    }

    const NEED_COMMANDERS = 2;
    const NEED_TOTAL = 20;
    const NEED_OTHERS = NEED_TOTAL - NEED_COMMANDERS; // 18

    const totalPacks = seat * 3;

    // We cannot reuse cards across packs by spec
    if (commanderCandidates.length < NEED_COMMANDERS * totalPacks) {
      return NextResponse.json(
        {
          error: `指揮官カードが不足しています（必要: ${NEED_COMMANDERS * totalPacks}、存在: ${commanderCandidates.length}）`,
        },
        { status: 400 },
      );
    }
    if (otherCandidates.length < NEED_OTHERS * totalPacks) {
      return NextResponse.json(
        {
          error: `その他カードが不足しています（必要: ${NEED_OTHERS * totalPacks}、存在: ${otherCandidates.length}）`,
        },
        { status: 400 },
      );
    }

    const packs: Array<{ id: string; cardIds: string[] }> = [];
    const used = new Set<string>();

    let remainingCommanders = shuffle(commanderCandidates);
    let remainingOthers = shuffle(otherCandidates);

    function takeUnique(source: string[], n: number): string[] {
      const res: string[] = [];
      let i = 0;
      while (res.length < n && i < source.length) {
        const cid = source[i++];
        if (used.has(cid)) continue;
        used.add(cid);
        res.push(cid);
      }
      return res;
    }

    for (let p = 0; p < totalPacks; p++) {
      if (remainingCommanders.length < NEED_COMMANDERS || remainingOthers.length < NEED_OTHERS) {
        // Re-shuffle remaining pool to continue fair randomization
        remainingCommanders = shuffle(remainingCommanders.filter((id) => !used.has(id)));
        remainingOthers = shuffle(remainingOthers.filter((id) => !used.has(id)));
      }

      const commanders = takeUnique(remainingCommanders, NEED_COMMANDERS);
      const others = takeUnique(remainingOthers, NEED_OTHERS);

      if (commanders.length < NEED_COMMANDERS || others.length < NEED_OTHERS) {
        return NextResponse.json({ error: "カードが不足しています" }, { status: 400 });
      }

      const packId = `pack_${p + 1}`;
      packs.push({ id: packId, cardIds: [...commanders, ...others] });
    }

    // Create Draft with seat-length empty picks arrays
    const draft = await prisma.draft.create({
      data: {
        poolId,
        seat,
        packs: packs as unknown as Prisma.InputJsonValue,
        picks: Array.from({ length: seat }, () => []) as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, poolId: true, seat: true, createdAt: true },
    });

    return NextResponse.json({ draft, packsCount: packs.length });
  } catch (err: unknown) {
    console.error("POST /api/drafts error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
