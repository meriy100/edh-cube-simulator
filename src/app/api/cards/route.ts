import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Server-side payload shape (DB does not store isCommander; use tags instead)
export type CardEntry = {
  count: number
  name: string
  set: string
  number: string
  tags: string[]
  raw: string
}

type PostBody = { entries: CardEntry[] }

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody
    if (!body || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (body.entries.length === 0) {
      return NextResponse.json({ count: 0 })
    }

    // Basic sanitization
    const data = body.entries.map((e) => ({
      count: Number.isFinite(e.count as unknown as number) ? (e.count as unknown as number) : 0,
      name: String(e.name || '').slice(0, 300),
      set: String(e.set || '').slice(0, 50),
      number: String(e.number || '').slice(0, 50),
      tags: Array.isArray(e.tags) ? e.tags.map(String).slice(0, 50) : [],
      raw: String(e.raw || '').slice(0, 1000),
    }))

    // Upsert by unique name: update existing, create new otherwise
    const results = await prisma.$transaction(
      data.map((d) =>
        prisma.card.upsert({
          where: { name: d.name },
          create: d,
          update: {
            count: d.count,
            set: d.set,
            number: d.number,
            tags: d.tags,
            raw: d.raw,
          },
        })
      )
    )

    return NextResponse.json({ count: results.length })
  } catch (err: unknown) {
    console.error('POST /api/cards error', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
