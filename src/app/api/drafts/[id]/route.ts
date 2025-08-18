import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_req: Request, ctx: unknown) {
  const { params } = ctx as { params: { id: string } };
  try {
    const id = params.id;
    await prisma.draft.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/drafts/[id] error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
