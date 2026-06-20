import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { resolveBattle } from '@/lib/battle'

// Rarity weights for AI deck selection (mirrors pack odds)
const RARITY_WEIGHTS: Record<string, number> = {
  COMMON: 60, UNCOMMON: 25, RARE: 10, EPIC: 4, LEGENDARY: 1,
}

// Weighted random pick without replacement from a card pool
function weightedPickCards(
  pool: { id: string; rarity: string; category: string }[],
  count: number
): { id: string; rarity: string; category: string }[] {
  const remaining = [...pool]
  const picked: typeof pool = []
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const total = remaining.reduce((s, c) => s + (RARITY_WEIGHTS[c.rarity] ?? 1), 0)
    let rand = Math.random() * total
    let chosen = remaining.length - 1
    for (let j = 0; j < remaining.length; j++) {
      rand -= RARITY_WEIGHTS[remaining[j].rarity] ?? 1
      if (rand <= 0) { chosen = j; break }
    }
    picked.push(remaining[chosen])
    remaining.splice(chosen, 1)
  }
  return picked
}

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

  // Validate challenger still owns all deck cards (unlocked + active)
  const missing: string[] = []
  for (const dc of deck.cards) {
    if (!dc.card.isActive) { missing.push(dc.card.name + ' (inactive)'); continue }
    const entry = await prisma.collectionEntry.findFirst({
      where: { userId: user.id, cardId: dc.cardId, listing: null, tradeItem: null },
    })
    if (!entry) missing.push(dc.card.name)
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Deck issue — update your deck: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const challengerCards = deck.cards.map((dc) => ({
    id: dc.card.id,
    rarity: dc.card.rarity as string,
    category: dc.card.category,
  }))

  // Find a real opponent with a saved deck (only active cards)
  let opponentCards: typeof challengerCards = []
  let opponentId: string | null = null
  let isAiOpponent = false

  const opponentDecks = await prisma.deck.findMany({
    where: { userId: { not: user.id }, cards: { some: {} } },
    include: { cards: { include: { card: true }, orderBy: { slot: 'asc' } } },
    take: 20,
  })

  // Only use opponent decks where all 5 cards are still active
  const validOpponentDecks = opponentDecks.filter(
    (d) => d.cards.length >= 5 && d.cards.every((dc) => dc.card.isActive)
  )

  if (validOpponentDecks.length > 0) {
    const picked = validOpponentDecks[Math.floor(Math.random() * validOpponentDecks.length)]
    opponentId = picked.userId
    opponentCards = picked.cards.slice(0, 5).map((dc) => ({
      id: dc.card.id,
      rarity: dc.card.rarity as string,
      category: dc.card.category,
    }))
  } else {
    // AI: weighted random selection from all active cards (diverse rarity distribution)
    isAiOpponent = true
    const allCards = await prisma.card.findMany({
      where: { isActive: true },
      select: { id: true, rarity: true, category: true },
    })
    const aiPicked = weightedPickCards(allCards, 5)
    if (aiPicked.length < 5) {
      return NextResponse.json({ error: 'Not enough active cards to run AI battle' }, { status: 500 })
    }
    opponentCards = aiPicked.map((c) => ({
      id: c.id,
      rarity: c.rarity as string,
      category: c.category,
    }))
  }

  const battleId = crypto.randomUUID()

  const { rounds, winnerId, challengerRoundsWon, opponentRoundsWon, isCleanSweep, coinReward } =
    resolveBattle(battleId, challengerCards, opponentCards, user.id, opponentId)

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
        data: { coinBalance: { increment: coinReward } },
      })
    }
  })

  // Notifications (best-effort)
  try {
    const sweepMsg = isCleanSweep ? ' (Clean Sweep! +100 coins)' : ' (+50 coins)'
    if (winnerId === user.id) {
      await prisma.notification.create({
        data: { userId: user.id, type: 'BATTLE_WON', message: `You won a card battle!${sweepMsg}`, isRead: false },
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
        data: { userId: opponentId, type: 'BATTLE_WON', message: `Your deck won a battle!${sweepMsg}`, isRead: false },
      })
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ battleId, winnerId, challengerRoundsWon, opponentRoundsWon, isCleanSweep, coinReward })
}
