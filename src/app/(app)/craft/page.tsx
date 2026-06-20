import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { CraftClient } from './CraftClient'

export default async function CraftPage() {
  const user = await requireAuth()

  // Get all common entries that are not locked
  const entries = await prisma.collectionEntry.findMany({
    where: {
      userId: user.id,
      card: { rarity: 'COMMON', isActive: true },
      listing: null,
      tradeItem: null,
    },
    include: { card: true },
    orderBy: { card: { name: 'asc' } },
  })

  // Find cards with duplicates (count per cardId)
  const countByCardId: Record<string, { count: number; entries: typeof entries }> = {}
  for (const e of entries) {
    if (!countByCardId[e.cardId]) countByCardId[e.cardId] = { count: 0, entries: [] }
    countByCardId[e.cardId].count++
    countByCardId[e.cardId].entries.push(e)
  }

  const serialized = entries.map((e) => ({
    id: e.id,
    cardId: e.cardId,
    card: {
      id: e.card.id,
      name: e.card.name,
      imageUrl: e.card.imageUrl,
      rarity: e.card.rarity,
      category: e.card.category,
      description: e.card.description,
    },
    copies: countByCardId[e.cardId]?.count ?? 1,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Crafting</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Duplicate Crafting</h1>
        <p className="text-slate-400 text-sm mt-1">
          Burn <span className="text-white font-semibold">3 Common cards</span> to receive <span className="text-green-400 font-semibold">1 random Uncommon</span>.
        </p>
      </div>
      <CraftClient entries={serialized} />
    </div>
  )
}
