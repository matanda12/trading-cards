import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const MAX_STREAK = 5
const COINS_PER_STREAK = 10

export async function POST() {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastLoginBonus: true, loginStreak: true, coinBalance: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const last = dbUser.lastLoginBonus

  // Already claimed today
  if (last && now.getTime() - last.getTime() < 24 * 60 * 60 * 1000) {
    return NextResponse.json({ awarded: false })
  }

  // Streak: within 48h of last bonus = continue streak, else reset
  const withinStreak = last && now.getTime() - last.getTime() < 48 * 60 * 60 * 1000
  const newStreak = withinStreak ? Math.min(dbUser.loginStreak + 1, MAX_STREAK) : 1
  const coins = newStreak * COINS_PER_STREAK

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginBonus: now,
      loginStreak: newStreak,
      coinBalance: { increment: coins },
    },
    select: { coinBalance: true },
  })

  return NextResponse.json({
    awarded: true,
    coins,
    streak: newStreak,
    newBalance: updated.coinBalance,
  })
}
