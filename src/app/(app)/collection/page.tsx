import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import { RarityBadge } from '@/components/cards/RarityBadge'
import Link from 'next/link'

export default async function CollectionPage() {
  const user = await requireAuth()

  const entries = await prisma.collectionEntry.findMany({
    where: { userId: user.id, card: { isActive: true } },
    include: { card: true },
    orderBy: [{ card: { rarity: 'asc' } }, { obtainedAt: 'desc' }],
  })

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Your collection is empty</h2>
        <p className="text-muted-foreground">Redeem a code or open a pack to get your first card.</p>
        <div className="flex gap-3">
          <Link href="/redeem" className="underline text-sm">Redeem a code</Link>
          <Link href="/packs" className="underline text-sm">Browse packs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Collection</h1>
        <span className="text-muted-foreground text-sm">{entries.length} card{entries.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1">
            <CardThumbnail card={entry.card} />
            <p className="text-xs text-center truncate text-muted-foreground">{entry.card.name}</p>
            <div className="flex justify-center">
              <RarityBadge rarity={entry.card.rarity} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
