import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { resolveBattle } from '@/lib/battle'

export async function POST() {
  const user = await requireAuth()

  // Load challenger's deck
  const deck = await prisma.deck.findUnique({
    where: { userId: user.id },
    include: { cards: { include: { card: true }, orderBy: { slot: 'asc' } } },
  })
  if (!deck || deck.cards.length < 5) {
    return NextResponse.json({ error: 'Save a complete 5-card deck first' }, { status: 400 })
  }

  // Validate challenger still owns all deck cards (unlocked)
  const missing: string[] = []
  for (const dc of deck.cards) {
    const entry = await prisma.collectionEntry.findFirst({
      where: { userId: user.id, cardId: dc.cardId, listing: null, tradeItem: null },
    })
    if (!entry) missing.push(dc.card.name)
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Your deck has cards you no longer own: ${missing.join(', ')}. Please update your deck.` },
      { status: 400 }
    )
  }

  const challengerCards = deck.cards.map((dc) => ({
    id: dc.card.id,
    rarity: dc.card.rarity as string,
    category: dc.card.category,
  }))

  // Find a real opponent with a saved deck
  let opponentCards: typeof challengerCards = []
  let opponentId: string | null = null
  let isAiOpponent = false

  const opponentDecks = await prisma.deck.findMany({
    where: { userId: { not: user.id }, cards: { some: {} } },
    include: { cards: { include: { card: true }, orderBy: { slot: 'asc' } } },
    take: 20,
  })

  const validOpponentDecks = opponentDecks.filter((d) => d.cards.length >= 5)

  if (validOpponentDecks.length > 0) {
    const picked = validOpponentDecks[Math.floor(Math.random() * validOpponentDecks.length)]
    opponentId = picked.userId
    opponentCards = picked.cards.slice(0, 5).map((dc) => ({
      id: dc.card.id,
      rarity: dc.card.rarity as string,
      category: dc.card.category,
    }))
  } else {
    // AI: pick 5 random active cards
    isAiOpponent = true
    const cardCount = await prisma.card.count({ where: { isActive: true } })
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, cardCount - 5)))
    const aiCards = await prisma.card.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      take: 5,
      skip,
    })
    if (aiCards.length < 5) {
      // fallback: take first 5 cards without skip
      const fallback = await prisma.card.findMany({ where: { isActive: true }, take: 5 })
      opponentCards = fallback.map((c) => ({ id: c.id, rarity: c.rarity as string, category: c.category }))
    } else {
      opponentCards = aiCards.map((c) => ({ id: c.id, rarity: c.rarity as string, category: c.category }))
    }
  }

  // Pre-generate battle ID so the seeded random is tied to the stored record
  const battleId = crypto.randomUUID()

  const { rounds, winnerId, challengerRoundsWon, opponentRoundsWon } = resolveBattle(
    battleId,
    challengerCards,
    opponentCards,
    user.id,
    opponentId
  )

  // Atomically create battle + award coins to winner
  await prisma.$transaction(async (tx) => {
    await tx.battle.create({
      data: {
        id: battleId,
        challengerId: user.id,
        opponentId: opponentId ?? undefined,
        isAiOpponent,
        winnerId,
        rounds: rounds as never,
        coinAwarded: winnerId !== null,
        foughtAt: new Date(),
      },
    })
    if (winnerId) {
      await tx.user.update({
        where: { id: winnerId },
        data: { coinBalance: { increment: 50 } },
      })
    }
  })

  // Notifications (non-critical, outside transaction)
  try {
    if (winnerId === user.id) {
      await prisma.notification.create({
        data: { userId: user.id, type: 'BATTLE_WON', message: 'You won a card battle! +50 coins', isRead: false },
      })
      if (opponentId) {
        await prisma.notification.create({
          data: { userId: opponentId, type: 'BATTLE_LOST', message: 'Your deck was challenged and lost a battle.', isRead: false },
        })
      }
    } else if (winnerId === opponentId && opponentId) {
      await prisma.notification.create({
        data: { userId: user.id, type: 'BATTLE_LOST', message: 'You lost the card battle. Better luck next time!', isRead: false },
      })
      await prisma.notification.create({
        data: { userId: opponentId, type: 'BATTLE_WON', message: 'Your deck won a card battle! +50 coins', isRead: false },
      })
    }
  } catch {
    // notifications are best-effort
  }

  return NextResponse.json({ battleId, winnerId, challengerRoundsWon, opponentRoundsWon })
}
