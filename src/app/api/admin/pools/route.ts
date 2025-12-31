import NextAuth from "next-auth";
import { after, NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/auth";
import z from "zod";
import { createPool, updatePoolStatus } from "@/repository/pools";
import { newPool } from "@/domain/entity/pool";
import Papa from "papaparse";
import { createCards, fetchCards, updateCard } from "@/repository/cards";
import { createPoolXCards } from "@/repository/poolXCards";
import { PoolXCard } from "@/domain/entity/poolXCard";
import { fetchScryfall } from "@/lib/scryfall";
import { newCardId } from "@/domain/entity/card";
import { publishMessage } from "@/lib/pubsub";

const { auth } = NextAuth(config);

const tagSchema = z.string().transform((v) => v.split(";").map((tag) => tag.trim()));

const rowSchema = z.object({
  name: z.string(),
  cmc: z.coerce.number().int(),
  type: z.string(),
  set: z.string(),
  collectorNumber: z.string(),
  originalImageUrl: z.string().optional(),
  originalImageBackUrl: z.string().optional(),
  tags: tagSchema,
});

const csvRowParser = z.preprocess((data) => {
  if (!Array.isArray(data)) return data;

  return {
    name: data[0],
    cmc: data[1],
    type: data[2],
    set: data[4],
    collectorNumber: data[5],
    originalImageUrl: data[11],
    originalImageBackUrl: data[12],
    tags: data[13],
  };
}, rowSchema);

const csvSchema = z.preprocess((rawCsv) => {
  if (typeof rawCsv !== "string") return rawCsv;

  const csvParseResults = Papa.parse<string[]>(rawCsv, {
    header: false,
    skipEmptyLines: true,
  });

  return csvParseResults.data.filter((row) => row[10] === "false");
}, z.array(csvRowParser));

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }

    const formData = await req.formData();
    const csvFile = formData.get("csv") as File;

    if (!csvFile) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    if (!csvFile.name.endsWith(".csv") && csvFile.type !== "text/csv") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
        { status: 400 },
      );
    }

    const csvContent = await csvFile.text();

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }
    const parsedRows = csvSchema.safeParse(csvContent);

    if (!parsedRows.success) {
      console.error("Invalid CSV format:", parsedRows.error);
      return NextResponse.json(
        {
          error: "Invalid CSV format. Please check the CSV file and try again.",
          details: parsedRows.error.issues,
          rawCsv: csvContent,
        },
        { status: 400 },
      );
    }

    await createCards(
      parsedRows.data.map((d) => ({
        name: d.name,
        cmc: d.cmc,
        type: d.type,
        set: d.set,
        collectorNumber: d.collectorNumber,
        originalImageUrl: d.originalImageUrl,
        originalImageBackUrl: d.originalImageBackUrl,
      })),
    );

    const pool = newPool({ count: parsedRows.data.length });
    after(async () => {
      try {
        await createPool(pool);

        await createPoolXCards(
          pool.id,
          parsedRows.data.map(
            (d): Omit<PoolXCard, "card"> => ({
              name: d.name,
              commander: d.tags.includes("0-commander"),
              tags: d.tags,
            }),
          ),
        );

        await updatePoolStatus(pool.id, "ready");

        const cards = await fetchCards({ names: parsedRows.data.map((d) => d.name) });
        const message = {
          cards: cards
            .filter((c) => c.scryfall === undefined)
            .map((card) => ({ id: newCardId(card.name), name: card.name })),
        };
        await publishMessage("worker-topic", message, { eventType: "attachScryfall" });
      } catch (error) {
        console.error("Error in background pool processing:", error);
        await updatePoolStatus(
          pool.id,
          "error",
          error instanceof Error ? error.message : "Unknown error occurred",
        );
      }
    });

    return NextResponse.json({
      id: pool.id,
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
