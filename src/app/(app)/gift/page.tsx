import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { GiftClient } from './GiftClient'

export default async function GiftPage() {
  const user = await requireAuth()

  const entries = await prisma.collectionEntry.findMany({
    where: {
      userId: user.id,
      card: { isActive: true },
      listing: null,
      tradeItem: null,
    },
    include: { card: true },
    orderBy: [{ card: { rarity: 'asc' } }, { card: { name: 'asc' } }],
  })

  const serialized = entries.map((e) => ({
    id: e.id,
    card: {
      id: e.card.id,
      name: e.card.name,
      imageUrl: e.card.imageUrl,
      rarity: e.card.rarity,
      category: e.card.category,
    },
  }))

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Gifting</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Gift a Card</h1>
        <p className="text-slate-400 text-sm mt-1">Send a card from your collection to another player.</p>
      </div>
      <GiftClient entries={serialized} />
    </div>
  )
}
