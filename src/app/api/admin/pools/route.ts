import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/auth";
import z from "zod";
import { createPool } from "@/repository/pools";
import { ulid } from "ulid";
import { newPool, PoolId } from "@/domain/entity/pool";
import Papa from "papaparse";

const { auth } = NextAuth(config);

const csvStringSchema = z.preprocess((arg) => {
  if (typeof arg === "string") {
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }
  }
  return arg;
}, z.string());

const tagSchema = csvStringSchema.transform((v) => v.split(";").map((tag) => tag.trim()));

const rowSchema = z.object({
  name: csvStringSchema,
  cmc: z.coerce.number().int(),
  type: csvStringSchema,
  set: csvStringSchema,
  colorIdentity: csvStringSchema,
  imageUrl: csvStringSchema,
  imageBackUrl: csvStringSchema.optional(),
  tags: tagSchema.optional(),
});

const csvRowParser = z.preprocess((data) => {
  if (!Array.isArray(data)) return data;

  return {
    name: data[0],
    cmc: data[1],
    type: data[2],
    set: data[4],
    colorIdentity: data[7],
    imageUrl: data[11],
    imageBackUrl: data[12],
    tags: data[13],
  };
}, rowSchema);

export const POST = async (req: NextRequest) => {
  try {
    // Check authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }

    // Get form data
    const formData = await req.formData();
    const csvFile = formData.get("csv") as File;

    if (!csvFile) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    // Validate file type
    if (!csvFile.name.endsWith(".csv") && csvFile.type !== "text/csv") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
        { status: 400 },
      );
    }

    // Read CSV content
    const csvContent = await csvFile.text();

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }
    const csvParseResults = Papa.parse<string[]>(csvContent, {
      header: false,
      skipEmptyLines: true,
    });
    if (!csvParseResults.data) {
      return NextResponse.json(
        {
          error: "Invalid CSV format. Please check the CSV file and try again.",
          details: csvParseResults.errors,
        },
        { status: 400 },
      );
    }

    const filteredMainboard = csvParseResults.data.filter((row) => row[10] === "false");

    const parsedRows = z.array(csvRowParser).safeParse(filteredMainboard);

    if (!parsedRows.success) {
      console.error("Invalid CSV format:", parsedRows.error);
      return NextResponse.json(
        {
          error: "Invalid CSV format. Please check the CSV file and try again.",
          details: parsedRows.error.issues,
          rowCsv: filteredMainboard,
        },
        { status: 400 },
      );
    }

    await createPool(newPool({ count: parsedRows.data.length }));

    // For now, return success with file info
    return NextResponse.json({
      message: "CSV file uploaded successfully",
      fileInfo: parsedRows.data,
      rowCsv: filteredMainboard,
      uploadedBy: session.user.email,
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
