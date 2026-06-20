import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { weightedDraw } from '@/lib/packs'

export async function POST(req: Request) {
  const user = await requireAuth()
  const { entryIds } = await req.json() as { entryIds: string[] }

  if (!Array.isArray(entryIds) || entryIds.length !== 3) {
    return NextResponse.json({ error: 'Must provide exactly 3 entry IDs' }, { status: 400 })
  }

  // Validate: all 3 entries belong to user, are COMMON, not locked in trade/listing
  const entries = await prisma.collectionEntry.findMany({
    where: {
      id: { in: entryIds },
      userId: user.id,
      card: { rarity: 'COMMON' },
      listing: null,
      tradeItem: null,
    },
  })

  if (entries.length !== 3) {
    return NextResponse.json({ error: 'Invalid entries — must own 3 unlocked Common cards' }, { status: 400 })
  }

  // Get all UNCOMMON cards available in any pack slot
  const uncommonSlots = await prisma.packSlot.findMany({
    where: { card: { rarity: 'UNCOMMON', isActive: true } },
  })

  if (uncommonSlots.length === 0) {
    return NextResponse.json({ error: 'No Uncommon cards available to craft' }, { status: 400 })
  }

  const [cardId] = weightedDraw(uncommonSlots, 1)

  const result = await prisma.$transaction(async (tx) => {
    await tx.collectionEntry.deleteMany({ where: { id: { in: entryIds } } })
    const newEntry = await tx.collectionEntry.create({
      data: { userId: user.id, cardId, source: 'CRAFT' },
      include: { card: true },
    })
    return newEntry
  })

  return NextResponse.json({ card: result.card })
}
