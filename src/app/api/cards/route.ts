import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ cards: [] });
  } catch (err: unknown) {
    console.error("GET /api/cards error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ count: 0, fetched: 0 });
}
