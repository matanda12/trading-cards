import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { BattleClient } from '@/components/battle/BattleClient'

export default async function BattlePage() {
  const user = await requireAuth()

  const [entries, deck, recentBattles] = await Promise.all([
    prisma.collectionEntry.findMany({
      where: { userId: user.id, listing: null, tradeItem: null, card: { isActive: true } },
      include: { card: { select: { id: true, name: true, imageUrl: true, rarity: true, category: true } } },
      orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
    }),
    prisma.deck.findUnique({
      where: { userId: user.id },
      include: { cards: { include: { card: { select: { id: true, name: true, imageUrl: true, rarity: true, category: true } } }, orderBy: { slot: 'asc' } } },
    }),
    prisma.battle.findMany({
      where: { OR: [{ challengerId: user.id }, { opponentId: user.id }] },
      include: { opponent: { select: { username: true, name: true } } },
      orderBy: { foughtAt: 'desc' },
      take: 20,
    }),
  ])

  const serializedEntries = entries.map((e) => ({
    id: e.id,
    cardId: e.cardId,
    card: { id: e.card.id, name: e.card.name, imageUrl: e.card.imageUrl, rarity: e.card.rarity as string, category: e.card.category },
  }))

  const savedDeckCards = (deck?.cards ?? []).map((dc) => ({
    slot: dc.slot,
    cardId: dc.cardId,
    card: { id: dc.card.id, name: dc.card.name, imageUrl: dc.card.imageUrl, rarity: dc.card.rarity as string, category: dc.card.category },
  }))

  const serializedBattles = recentBattles.map((b) => ({
    id: b.id,
    winnerId: b.winnerId,
    foughtAt: b.foughtAt.toISOString(),
    isAiOpponent: b.isAiOpponent,
    opponent: b.opponent ? { username: b.opponent.username, name: b.opponent.name } : null,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Battle Arena</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Card Battle</h1>
        <p className="text-slate-400 text-sm mt-1">
          Build a <span className="text-white font-semibold">5-card deck</span>, challenge opponents, and earn{' '}
          <span className="text-amber-400 font-semibold">50–100 coins</span> per win.
        </p>
      </div>
      <BattleClient
        userId={user.id}
        entries={serializedEntries}
        savedDeckCards={savedDeckCards}
        recentBattles={serializedBattles}
      />
    </div>
  )
}
