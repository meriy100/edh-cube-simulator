import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Reuse server-side CardEntry shape
export type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  raw: string;
};

type PostBody = { entries: CardEntry[]; title?: string | null; raw?: string | null };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchScryfallBySetAndNumber(
  setCode: string,
  collectorNumber: string,
): Promise<Prisma.InputJsonValue> {
  const set = encodeURIComponent(setCode.toLowerCase());
  const num = encodeURIComponent(collectorNumber);
  const url = `https://api.scryfall.com/cards/${set}/${num}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    throw new Error(`Scryfall error ${res.status} for ${setCode} ${collectorNumber}`);
  }
  return (await res.json()) as unknown as Prisma.InputJsonValue;
}

export async function GET() {
  try {
    const pools = await prisma.pool.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { poolCards: true } },
      },
    });
    return NextResponse.json({ pools });
  } catch (err: unknown) {
    console.error("GET /api/pools error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    if (!body || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    // Pool title should be creation datetime (JST)
    const now = new Date();
    const title = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });

    const entries = body.entries;
    if (entries.length === 0) {
      // Create empty pool if desired
      const pool = await prisma.pool.create({ data: { title, raw: body.raw ?? null } });
      return NextResponse.json({ poolId: pool.id, count: 0, fetched: 0 });
    }

    // Sanitize
    const data = entries.map((e) => ({
      count: Number.isFinite(e.count as unknown as number) ? (e.count as unknown as number) : 0,
      name: String(e.name || "").slice(0, 300),
      set: String(e.set || "").slice(0, 50),
      number: String(e.number || "").slice(0, 50),
      tags: Array.isArray(e.tags) ? e.tags.map(String).slice(0, 50) : [],
      raw: String(e.raw || "").slice(0, 1000),
    }));

    // Upsert Cards first (do not overwrite scryfallJson)
    // Large single-transaction batches can cause Postgres to close the connection (P1017).
    // Process in chunks to keep transactions small and stable.
    const UPSERT_CHUNK = 50;
    for (let i = 0; i < data.length; i += UPSERT_CHUNK) {
      const chunk = data.slice(i, i + UPSERT_CHUNK);
      await prisma.$transaction(
        chunk.map((d) =>
          prisma.card.upsert({
            where: { name: d.name },
            create: { count: d.count, name: d.name, set: d.set, number: d.number, raw: d.raw },
            update: {
              // Do not overwrite scryfallJson here
              count: d.count,
              set: d.set,
              number: d.number,
              raw: d.raw,
            },
          }),
        ),
      );
    }

    // Ensure Scryfall JSON for missing ones (similar to /api/cards)
    const names = Array.from(new Set(data.map((d) => d.name)));
    const missing = await prisma.card.findMany({
      where: { name: { in: names }, scryfallJson: { equals: Prisma.DbNull } },
      select: { name: true },
    });

    const latestMap = new Map<string, { set: string; number: string }>();
    for (const d of data) latestMap.set(d.name, { set: d.set, number: d.number });
    const need = missing.map((m) => ({ name: m.name, ...latestMap.get(m.name)! }));

    const CHUNK_SIZE = 5;
    const DELAY_MS = 300;
    let fetched = 0;
    for (let i = 0; i < need.length; i += CHUNK_SIZE) {
      const chunk = need.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (n) => {
          try {
            const json = await fetchScryfallBySetAndNumber(n.set, n.number);
            return { name: n.name, json };
          } catch {
            console.warn("Scryfall fetch failed for", n);
            return null;
          }
        }),
      );
      const updates = results.filter(
        (r): r is { name: string; json: Prisma.InputJsonValue } => !!r,
      );
      if (updates.length) {
        await prisma.$transaction(
          updates.map((u) =>
            prisma.card.update({ where: { name: u.name }, data: { scryfallJson: u.json } }),
          ),
        );
        fetched += updates.length;
      }
      if (i + CHUNK_SIZE < need.length) await sleep(DELAY_MS);
    }

    // Create Pool
    const pool = await prisma.pool.create({ data: { title, raw: body.raw ?? null } });

    // Build a map from card name to id
    const cards = await prisma.card.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    const idByName = new Map(cards.map((c) => [c.name, c.id] as const));

    // Merge duplicates by name (sum counts) and union tags per name
    const countByName = new Map<string, number>();
    const tagsByName = new Map<string, Set<string>>();
    for (const d of data) {
      countByName.set(d.name, (countByName.get(d.name) || 0) + (d.count || 0));
      const set = tagsByName.get(d.name) ?? new Set<string>();
      for (const t of d.tags) set.add(t);
      tagsByName.set(d.name, set);
    }

    // Create join rows with per-pool tags
    const joinData = Array.from(countByName.entries()).map(([name, count]) => {
      const cardId = idByName.get(name);
      if (!cardId) throw new Error(`Card not found after upsert: ${name}`);
      const tagSet = tagsByName.get(name) ?? new Set<string>();
      const tags = Array.from(tagSet);
      return { poolId: pool.id, cardId, count, tags };
    });

    // Insert in chunks to avoid large single transactions that can trigger P1017
    const JOIN_CHUNK = 100;
    for (let i = 0; i < joinData.length; i += JOIN_CHUNK) {
      const chunk = joinData.slice(i, i + JOIN_CHUNK);
      await prisma.poolCard.createMany({ data: chunk, skipDuplicates: true });
    }

    return NextResponse.json({ poolId: pool.id, count: data.length, fetched });
  } catch (err: unknown) {
    console.error("POST /api/pools error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
