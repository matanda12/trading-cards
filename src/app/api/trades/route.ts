import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const createSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().optional(),
  offeredEntryIds: z.array(z.string()).min(1),
  wantedEntryIds: z.array(z.string()).min(1),
})

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'sent'

  const trades = await prisma.trade.findMany({
    where: tab === 'sent' ? { initiatorId: user.id } : { receiverId: user.id },
    include: {
      initiator: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
      items: { include: { collectionEntry: { include: { card: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(trades)
}

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { receiverId, message, offeredEntryIds, wantedEntryIds } = parsed.data

  if (receiverId === user.id) {
    return NextResponse.json({ error: 'Cannot trade with yourself' }, { status: 400 })
  }

  // Validate offered entries belong to current user and are available
  const offeredEntries = await prisma.collectionEntry.findMany({
    where: { id: { in: offeredEntryIds }, userId: user.id },
    include: { tradeItem: true, listing: true },
  })

  if (offeredEntries.length !== offeredEntryIds.length) {
    return NextResponse.json({ error: 'Some offered cards are invalid' }, { status: 400 })
  }

  for (const entry of offeredEntries) {
    if (entry.listing?.status === 'ACTIVE') {
      return NextResponse.json({ error: `Card is listed on marketplace` }, { status: 409 })
    }
    if (entry.tradeItem) {
      return NextResponse.json({ error: `Card is already in a pending trade` }, { status: 409 })
    }
  }

  // Validate wanted entries belong to receiver and are available
  const wantedEntries = await prisma.collectionEntry.findMany({
    where: { id: { in: wantedEntryIds }, userId: receiverId },
    include: { tradeItem: true, listing: true },
  })

  if (wantedEntries.length !== wantedEntryIds.length) {
    return NextResponse.json({ error: 'Some wanted cards are invalid' }, { status: 400 })
  }

  for (const entry of wantedEntries) {
    if (entry.listing?.status === 'ACTIVE') {
      return NextResponse.json({ error: `A wanted card is listed on marketplace` }, { status: 409 })
    }
    if (entry.tradeItem) {
      return NextResponse.json({ error: `A wanted card is in a pending trade` }, { status: 409 })
    }
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  const initiator = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } })
  const initiatorName = initiator?.name ?? initiator?.email?.split('@')[0] ?? 'Someone'

  const trade = await prisma.trade.create({
    data: {
      initiatorId: user.id,
      receiverId,
      message,
      expiresAt,
      items: {
        create: [
          ...offeredEntryIds.map((id) => ({ ownerId: user.id, collectionEntryId: id })),
          ...wantedEntryIds.map((id) => ({ ownerId: receiverId, collectionEntryId: id })),
        ],
      },
    },
  })

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'TRADE_RECEIVED',
      message: `${initiatorName} sent you a trade offer`,
    },
  })

  return NextResponse.json(trade, { status: 201 })
}
