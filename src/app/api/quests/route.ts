import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireAuth()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [packOpened, tradeCompleted, collectionCount] = await Promise.all([
    prisma.packOpen.count({
      where: { userId: user.id, openedAt: { not: null }, createdAt: { gte: todayStart } },
    }),
    prisma.trade.count({
      where: {
        status: 'ACCEPTED',
        updatedAt: { gte: todayStart },
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
    }),
    prisma.collectionEntry.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({
    quests: [
      { id: 'open_pack', label: 'Open a pack today', emoji: '📦', done: packOpened > 0, progress: Math.min(packOpened, 1), total: 1 },
      { id: 'complete_trade', label: 'Complete a trade today', emoji: '🤝', done: tradeCompleted > 0, progress: Math.min(tradeCompleted, 1), total: 1 },
      { id: 'have_cards', label: 'Own at least 5 cards', emoji: '🃏', done: collectionCount >= 5, progress: Math.min(collectionCount, 5), total: 5 },
    ],
  })
}
