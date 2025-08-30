import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Parse a semicolon-separated CSV line with simple quote handling
function parseSemicolonCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}

function normalizeHeader(h: string): string {
  return h.trim();
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: poolId } = await ctx.params;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("csv");
    if (!file || typeof file !== "object" || !("text" in file)) {
      return NextResponse.json(
        { error: "csv file field is required (name: csv)" },
        { status: 400 },
      );
    }

    const text = await (file as File).text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ created: 0, ignored: [] });
    }

    const header = parseSemicolonCsvLine(lines[0]).map(normalizeHeader);
    const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

    const idIdx = idx("ID");
    const colorIdx = idx("Color Identity");
    const prerequisitesIdx = idx("Prerequisites");
    const stepsIdx = idx("Steps");
    const resultsIdx = idx("Results");

    const cardIdx: number[] = [];
    for (let n = 1; n <= 10; n++) {
      const i = idx(`Card ${n}`);
      cardIdx.push(i);
    }

    // Collect all unique card names
    const allNames = new Set<string>();
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseSemicolonCsvLine(lines[i]);
      rows.push(cols);
      for (const ci of cardIdx) {
        if (ci >= 0) {
          const nm = (cols[ci] ?? "").trim();
          if (nm) allNames.add(nm);
        }
      }
    }

    // Fetch card records
    const names = Array.from(allNames);
    const cards = await prisma.card.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    const idByName = new Map(cards.map((c) => [c.name, c.id] as const));

    // Runtime guard: ensure Prisma Client has Combo model available
    const hasCombo = (prisma as unknown as { combo?: { create?: unknown } })?.combo?.create;
    if (typeof hasCombo !== "function") {
      return NextResponse.json(
        {
          error:
            "Combo model is not available in Prisma Client. Please run `yarn prisma:generate` and ensure the database is migrated with `yarn prisma:push`.",
        },
        { status: 500 },
      );
    }

    type Ignored = {
      rowIndex: number;
      sourceId?: string;
      missing: Array<{ key: string; value: string }>;
    };
    const ignored: Ignored[] = [];
    let created = 0;

    // Insert combos for rows that have all cards
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      // Build missing list for this row
      const missing: Array<{ key: string; value: string }> = [];
      const cardIds: (string | null)[] = [];
      for (let n = 0; n < cardIdx.length; n++) {
        const ci = cardIdx[n];
        if (ci < 0) {
          cardIds.push(null);
          continue;
        }
        const val = (cols[ci] ?? "").trim();
        if (!val) {
          cardIds.push(null);
          continue;
        }
        const id = idByName.get(val) ?? null;
        if (!id) {
          missing.push({ key: `Card ${n + 1}`, value: val });
        }
        cardIds.push(id);
      }

      if (missing.length > 0) {
        const sid = idIdx >= 0 ? (cols[idIdx] ?? "").trim() : undefined;
        ignored.push({ rowIndex: r + 2 /* 1-based with header */, sourceId: sid, missing });
        continue; // skip creating this combo
      }

      const data = {
        poolId,
        sourceId: (idIdx >= 0 ? (cols[idIdx] ?? "").trim() : "") || `${r + 1}`,
        colorIdentity: colorIdx >= 0 ? (cols[colorIdx] ?? "").trim() : null,
        prerequisites: prerequisitesIdx >= 0 ? (cols[prerequisitesIdx] ?? "").trim() : null,
        steps: stepsIdx >= 0 ? (cols[stepsIdx] ?? "").trim() : null,
        results: resultsIdx >= 0 ? (cols[resultsIdx] ?? "").trim() : null,
        card1Id: cardIds[0],
        card2Id: cardIds[1],
        card3Id: cardIds[2],
        card4Id: cardIds[3],
        card5Id: cardIds[4],
        card6Id: cardIds[5],
        card7Id: cardIds[6],
        card8Id: cardIds[7],
        card9Id: cardIds[8],
        card10Id: cardIds[9],
      } as const;

      await prisma.combo.create({ data });
      created += 1;
    }

    return NextResponse.json({ created, ignored });
  } catch (err: unknown) {
    console.error("POST /api/pools/[id]/combos error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
