import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, ctx: unknown) {
  const { params } = ctx as { params: { id: string } }
  try {
    const id = params.id
    const pool = await prisma.pool.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        raw: true,
        poolCards: {
          select: {
            count: true,
            card: { select: { id: true, name: true, set: true, number: true, tags: true, raw: true } },
          },
          orderBy: { card: { name: 'asc' } },
        },
      },
    })
    if (!pool) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Shape data similar to CardEntry for frontend reuse
    const entries = pool.poolCards.map((pc) => ({
      count: pc.count,
      name: pc.card.name,
      set: pc.card.set,
      number: pc.card.number,
      tags: pc.card.tags,
      raw: pc.card.raw,
    }))

    return NextResponse.json({ pool: { id: pool.id, title: pool.title, createdAt: pool.createdAt, updatedAt: pool.updatedAt, raw: pool.raw }, entries })
  } catch (err: unknown) {
    console.error('GET /api/pools/[id] error', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: unknown) {
  const { params } = ctx as { params: { id: string } }
  try {
    const id = params.id
    await prisma.pool.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('DELETE /api/pools/[id] error', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
