import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({});
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  console.log(id);
  return NextResponse.json({ ok: true });
}
