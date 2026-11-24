import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/auth";
import z from "zod";
import Papa from "papaparse";
import { importPool, poolImportRowSchema } from "@/lib/poolImport";

const { auth } = NextAuth(config);

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
}, poolImportRowSchema);

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

    const poolId = await importPool(parsedRows.data, version);

    return NextResponse.json({
      id: poolId,
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
