import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Server-side payload shape (DB does not store isCommander; use tags instead)
export type CardEntry = {
  count: number;
  name: string;
  set: string;
  number: string;
  tags: string[];
  raw: string;
};

type PostBody = { entries: CardEntry[] };

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Support both `name` (literal, can include commas) and `names` (can be repeated or comma-separated)
    const nameParams = url.searchParams.getAll("name"); // literal names, do NOT split by comma
    const namesParams = url.searchParams.getAll("names"); // may be repeated or comma-separated

    let names: string[] | null = null;
    if (namesParams.length > 1) {
      // e.g., /api/cards?names=Foo&names=Bar
      names = namesParams.map((n) => n.trim()).filter(Boolean);
    } else if (namesParams.length === 1) {
      // Prefer "$" as delimiter to avoid conflicts with commas inside names; fall back to comma for backward compatibility
      const raw = namesParams[0];
      if (raw.includes("$")) {
        names = raw
          .split("$")
          .map((n) => n.trim())
          .filter(Boolean);
      } else {
        names = raw
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
      }
    } else if (nameParams.length > 0) {
      // One or many `name` params are treated as literal names (no splitting on commas)
      names = nameParams.map((n) => n.trim()).filter(Boolean);
    } else {
      names = null;
    }

    const cards = await prisma.card.findMany({
      where: names && names.length > 0 ? { name: { in: names } } : undefined,
      select: {
        name: true,
        scryfallJson: true,
        cubeCobra: true,
        set: true,
        number: true,
        count: true,
      },
      orderBy: { name: "asc" },
    });

    // Log any requested names that were not included in the response
    if (names && names.length > 0) {
      const returnedNames = new Set(cards.map((c) => c.name));
      const missing = names.filter((n) => !returnedNames.has(n));
      if (missing.length > 0) {
        console.warn("[GET /api/cards] Missing names from response:", missing);
      }
    }

    return NextResponse.json({ cards });
  } catch (err: unknown) {
    console.error("GET /api/cards error", err);
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

    if (body.entries.length === 0) {
      return NextResponse.json({ count: 0, fetched: 0 });
    }

    // Basic sanitization
    const data = body.entries.map((e) => ({
      count: Number.isFinite(e.count as unknown as number) ? (e.count as unknown as number) : 0,
      name: String(e.name || "").slice(0, 300),
      set: String(e.set || "").slice(0, 50),
      number: String(e.number || "").slice(0, 50),
      tags: Array.isArray(e.tags) ? e.tags.map(String).slice(0, 50) : [],
      raw: String(e.raw || "").slice(0, 1000),
    }));

    // Upsert by unique name: update existing, create new otherwise
    const results = await prisma.$transaction(
      data.map((d) =>
        prisma.card.upsert({
          where: { name: d.name },
          create: { count: d.count, name: d.name, set: d.set, number: d.number, raw: d.raw }, // scryfallJson remains null on create
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

    // After saving, fetch Scryfall data for those missing it
    const names = Array.from(new Set(data.map((d) => d.name)));
    const missing = await prisma.card.findMany({
      where: { name: { in: names }, scryfallJson: { equals: Prisma.DbNull } },
      select: { name: true },
    });

    const needMap = new Map<string, { set: string; number: string }>();
    for (const m of missing) {
      // use the latest set/number provided in this request for that name
      const last = [...data].reverse().find((d) => d.name === m.name);
      if (last && last.set && last.number) {
        needMap.set(m.name, { set: last.set, number: last.number });
      }
    }

    // Batch requests to Scryfall to avoid spikes
    const CHUNK_SIZE = 5;
    const DELAY_MS = 300;
    const entriesToFetch = Array.from(needMap.entries());
    let fetched = 0;
    for (let i = 0; i < entriesToFetch.length; i += CHUNK_SIZE) {
      const chunk = entriesToFetch.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async ([name, info]) => {
          try {
            const json = await fetchScryfallBySetAndNumber(info.set, info.number);
            return { name, json };
          } catch (e) {
            console.warn("Scryfall fetch failed for", name, info.set, info.number, e);
            return null;
          }
        }),
      );
      const updates = results.filter(
        (r): r is { name: string; json: Prisma.InputJsonValue } => !!r,
      );
      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map((u) =>
            prisma.card.update({ where: { name: u.name }, data: { scryfallJson: u.json } }),
          ),
        );
        fetched += updates.length;
      }
      if (i + CHUNK_SIZE < entriesToFetch.length) {
        await sleep(DELAY_MS);
      }
    }

    return NextResponse.json({ count: results.length, fetched });
  } catch (err: unknown) {
    console.error("POST /api/cards error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
