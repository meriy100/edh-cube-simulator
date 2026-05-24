import NextAuth from "next-auth";
import { after, NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/auth";
import z from "zod";
import { createPool, updatePoolStatus } from "@/repository/pools";
import { newPool } from "@/domain/entity/pool";
import Papa from "papaparse";
import { createCards, fetchCards } from "@/repository/cards";
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
    originalImageUrl: data[12],
    originalImageBackUrl: data[13],
    tags: data[14],
  };
}, rowSchema);

const csvSchema = z.preprocess((rawCsv) => {
  if (typeof rawCsv !== "string") return rawCsv;

  const csvParseResults = Papa.parse<Record<string, string>>(rawCsv, {
    header: true,
    skipEmptyLines: true,
  });

  return csvParseResults.data
    .filter((row) => row["maybeboard"] === "false")
    .map((row) => [
      row["name"],
      row["CMC"],
      row["Type"],
      row["Color"],
      row["Set"],
      row["Collector Number"],
      row["Rarity"],
      row["Color Category"],
      row["status"],
      row["Finish"],
      row["board"],
      row["maybeboard"],
      row["image URL"],
      row["image Back URL"],
      row["tags"],
      row["Notes"],
      row["MTGO ID"],
      row["Custom"],
      row["Voucher"],
    ]);
}, z.array(csvRowParser));

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }

    const formData = await req.formData();
    const csvFile = formData.get("csv") as File;
    const version = z.string().parse(formData.get("version"));

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

    const fixedNames = new Map<string, string>();
    await Promise.all(
      parsedRows.data
        .filter((d) => d.tags.includes("x-edh-cube-discover:fixed-name"))
        .map(async (d) => {
          const { en } = await fetchScryfall(d.name, { onlyEn: true });
          fixedNames.set(d.name, en.name);
        }),
    );

    await createCards(
      parsedRows.data.map((d) => ({
        name: fixedNames.get(d.name) ?? d.name,
        cmc: d.cmc,
        type: d.type,
        set: d.set,
        collectorNumber: d.collectorNumber,
        originalImageUrl: d.originalImageUrl,
        originalImageBackUrl: d.originalImageBackUrl,
      })),
    );

    const pool = newPool({ count: parsedRows.data.length, version });
    await createPool(pool);

    after(async () => {
      try {
        await createPoolXCards(
          pool.id,
          parsedRows.data.map(
            (d): Omit<PoolXCard, "card"> => ({
              name: fixedNames.get(d.name) ?? d.name,
              commander: d.tags.includes("0-commander"),
              outside: d.tags.some((tag) => tag.startsWith("9-")),
              tags: d.tags,
            }),
          ),
        );

        await updatePoolStatus(pool.id, "ready");

        const cards = await fetchCards({
          names: parsedRows.data.map((d) => fixedNames.get(d.name) ?? d.name),
        });
        const attachScryfallMessage = {
          cards: cards
            .filter((c) => c.scryfall === undefined)
            .map((card) => ({ id: newCardId(card.name), name: card.name })),
        };

        const saveCombosMessage = {
          poolId: pool.id,
          cards: parsedRows.data
            .map((d) => fixedNames.get(d.name) ?? d.name)
            .map((name) => ({ id: newCardId(name), name: name })),
        };

        await Promise.all([
          publishMessage("worker-topic", attachScryfallMessage, { eventType: "attachScryfall" }),
          publishMessage("worker-topic", saveCombosMessage, { eventType: "saveCombos" }),
        ]);
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
