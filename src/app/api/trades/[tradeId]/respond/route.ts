import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const schema = z.object({ action: z.enum(['ACCEPT', 'REJECT', 'CANCEL', 'EXPIRE']) })

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ tradeId: string }> }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tradeId } = await ctx.params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { action } = parsed.data

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { items: { include: { collectionEntry: true } } },
  })

  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.status !== 'PENDING') {
    return NextResponse.json({ error: 'Trade is no longer pending' }, { status: 409 })
  }

  const isInitiator = trade.initiatorId === user.id
  const isReceiver = trade.receiverId === user.id

  if (action === 'EXPIRE') {
    if (trade.expiresAt > new Date()) {
      return NextResponse.json({ error: 'Trade has not expired yet' }, { status: 409 })
    }
    const updated = await prisma.trade.update({ where: { id: tradeId }, data: { status: 'EXPIRED' } })
    return NextResponse.json(updated)
  }

  if (action === 'CANCEL' && !isInitiator) {
    return NextResponse.json({ error: 'Only the initiator can cancel' }, { status: 403 })
  }
  if ((action === 'ACCEPT' || action === 'REJECT') && !isReceiver) {
    return NextResponse.json({ error: 'Only the receiver can accept or reject' }, { status: 403 })
  }

  if (action !== 'ACCEPT') {
    const updated = await prisma.trade.update({
      where: { id: tradeId },
      data: { status: action === 'CANCEL' ? 'CANCELLED' : 'REJECTED' },
    })
    return NextResponse.json(updated)
  }

  // ACCEPT — atomic ownership swap
  const offeredItems = trade.items.filter((i) => i.ownerId === trade.initiatorId)
  const wantedItems = trade.items.filter((i) => i.ownerId === trade.receiverId)

  try {
    await prisma.$transaction([
      // Transfer offered cards to receiver
      prisma.collectionEntry.updateMany({
        where: { id: { in: offeredItems.map((i) => i.collectionEntryId) } },
        data: { userId: trade.receiverId, source: 'TRADE' },
      }),
      // Transfer wanted cards to initiator
      prisma.collectionEntry.updateMany({
        where: { id: { in: wantedItems.map((i) => i.collectionEntryId) } },
        data: { userId: trade.initiatorId, source: 'TRADE' },
      }),
      prisma.trade.update({ where: { id: tradeId }, data: { status: 'ACCEPTED' } }),
    ])
  } catch {
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
