import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CollectionClient } from '@/components/collection/CollectionClient'

export default async function CollectionPage() {
  const user = await requireAuth()

  const entries = await prisma.collectionEntry.findMany({
    where: { userId: user.id, card: { isActive: true } },
    include: { card: true },
    orderBy: [{ card: { rarity: 'asc' } }, { obtainedAt: 'desc' }],
  })

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="text-5xl">🃏</div>
        <div>
          <h2 className="text-xl font-bold">Your collection is empty</h2>
          <p className="text-muted-foreground text-sm mt-1">Redeem a code or open a pack to get your first card.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/redeem" className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-accent/30 transition-colors">
            Redeem a code
          </Link>
          <Link href="/packs" className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors">
            Browse packs
          </Link>
        </div>
      </div>
    )
  }

  // Serialize dates for client component
  const serialized = entries.map((e) => ({
    id: e.id,
    cardId: e.cardId,
    obtainedAt: e.obtainedAt.toISOString(),
    card: {
      id: e.card.id,
      name: e.card.name,
      imageUrl: e.card.imageUrl,
      rarity: e.card.rarity,
      category: e.card.category,
      description: e.card.description,
    },
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ My Collection</p>
          <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">My Collection</h1>
        </div>
      </div>
      <CollectionClient entries={serialized} />
    </div>
  )
}
