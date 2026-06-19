import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { weightedDraw } from '@/lib/packs'

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ packId: string }> }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { packId } = await ctx.params

  const pack = await prisma.pack.findUnique({
    where: { id: packId, isActive: true },
    include: { slots: true },
  })

  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  if (pack.slots.length === 0) {
    return NextResponse.json({ error: 'Pack has no cards configured' }, { status: 400 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (currentUser.coinBalance < pack.coinCost) {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 })
  }

  const cardIds = weightedDraw(pack.slots, pack.cardCount)

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { coinBalance: { decrement: pack.coinCost } },
    })

    const packOpen = await tx.packOpen.create({
      data: { userId: user.id, packId: pack.id, openedAt: now },
    })

    const entries = await Promise.all(
      cardIds.map((cardId) =>
        tx.collectionEntry.create({
          data: { userId: user.id, cardId, source: 'PACK' },
          include: { card: true },
        })
      )
    )

    await tx.packOpenResult.createMany({
      data: entries.map((e) => ({
        packOpenId: packOpen.id,
        collectionEntryId: e.id,
      })),
    })

    return entries
  })

  return NextResponse.json({ cards: result.map((e) => e.card) })
}
