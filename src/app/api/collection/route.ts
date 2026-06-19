import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rarity = searchParams.get('rarity')
  const category = searchParams.get('category')
  const search = searchParams.get('q')
  // Allow fetching another user's collection for trade purposes
  const targetUserId = searchParams.get('userId') ?? user.id
  const isOwn = targetUserId === user.id

  const allEntries = await prisma.collectionEntry.findMany({
    where: {
      userId: targetUserId,
      card: {
        ...(rarity ? { rarity: rarity as never } : {}),
        ...(category ? { category } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        isActive: true,
      },
    },
    include: {
      card: true,
      listing: { select: { id: true, status: true } },
      tradeItem: { select: { tradeId: true, trade: { select: { status: true } } } },
    },
    orderBy: { obtainedAt: 'desc' },
  })

  // For other users' collections, only expose tradeable (unlocked) cards
  const entries = isOwn
    ? allEntries
    : allEntries.filter(
        (e) => e.listing?.status !== 'ACTIVE' && e.tradeItem?.trade?.status !== 'PENDING'
      )

  return NextResponse.json(entries)
}
