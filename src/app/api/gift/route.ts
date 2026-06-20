import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const user = await requireAuth()
  const { entryId, toUsername, message } = await req.json() as { entryId: string; toUsername: string; message?: string }

  if (!entryId || !toUsername) {
    return NextResponse.json({ error: 'entryId and toUsername are required' }, { status: 400 })
  }

  const recipient = await prisma.user.findFirst({
    where: { username: toUsername.replace(/^@/, '') },
    select: { id: true, username: true, name: true },
  })
  if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (recipient.id === user.id) return NextResponse.json({ error: 'Cannot gift to yourself' }, { status: 400 })

  // Validate entry belongs to sender and is not locked
  const entry = await prisma.collectionEntry.findFirst({
    where: { id: entryId, userId: user.id, listing: null, tradeItem: null },
    include: { card: true },
  })
  if (!entry) return NextResponse.json({ error: 'Card not found or is locked in a trade/listing' }, { status: 404 })

  const sender = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true, name: true } })
  const senderName = sender?.username ? `@${sender.username}` : (sender?.name ?? 'Someone')

  await prisma.$transaction(async (tx) => {
    await tx.collectionEntry.update({ where: { id: entryId }, data: { userId: recipient.id } })
    await tx.gift.create({
      data: { fromUserId: user.id, toUserId: recipient.id, collectionEntryId: entryId, message: message ?? null },
    })
    await tx.notification.create({
      data: {
        userId: recipient.id,
        type: 'GIFT_RECEIVED',
        message: `${senderName} gifted you "${entry.card.name}"!${message ? ` "${message}"` : ''}`,
      },
    })
  })

  return NextResponse.json({ ok: true, card: { name: entry.card.name } })
}
