import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saveSchema = z.object({
  cards: z
    .array(z.object({ cardId: z.string().min(1), slot: z.number().int().min(1).max(5) }))
    .length(5),
})

export async function GET() {
  const user = await requireAuth()

  const deck = await prisma.deck.findUnique({
    where: { userId: user.id },
    include: { cards: { include: { card: true }, orderBy: { slot: 'asc' } } },
  })

  return NextResponse.json(deck ?? null)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const body = saveSchema.parse(await req.json())

  // Verify distinct card IDs
  const cardIds = body.cards.map((c) => c.cardId)
  if (new Set(cardIds).size !== 5) {
    return NextResponse.json({ error: 'All 5 deck cards must be different' }, { status: 400 })
  }

  // Verify user owns at least one unlocked copy of each card (must also be active)
  const missing: string[] = []
  for (const cardId of cardIds) {
    const card = await prisma.card.findUnique({ where: { id: cardId }, select: { name: true, isActive: true } })
    if (!card || !card.isActive) { missing.push(card?.name ?? cardId + ' (inactive)'); continue }
    const entry = await prisma.collectionEntry.findFirst({
      where: { userId: user.id, cardId, listing: null, tradeItem: null },
    })
    if (!entry) missing.push(card.name)
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `You don't own an unlocked copy of: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  // Upsert deck + replace cards in a transaction
  const deck = await prisma.$transaction(async (tx) => {
    const d = await tx.deck.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: { updatedAt: new Date() },
    })
    await tx.deckCard.deleteMany({ where: { deckId: d.id } })
    await tx.deckCard.createMany({
      data: body.cards.map((c) => ({ deckId: d.id, cardId: c.cardId, slot: c.slot })),
    })
    return tx.deck.findUnique({
      where: { id: d.id },
      include: { cards: { include: { card: true }, orderBy: { slot: 'asc' } } },
    })
  })

  return NextResponse.json(deck, { status: 200 })
}
