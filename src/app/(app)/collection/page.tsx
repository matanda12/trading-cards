import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
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
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="text-5xl">🃏</div>
        <div>
          <h2 className="text-xl font-bold">Your collection is empty</h2>
          <p className="text-muted-foreground text-sm mt-1">Redeem a code or open a pack to get your first card.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/redeem"
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-accent/30 transition-colors"
          >
            Redeem a code
          </Link>
          <Link
            href="/packs"
            className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
          >
            Browse packs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">My Collection</p>
          <h1 className="text-3xl font-black tracking-tight">All Cards</h1>
        </div>
        <span className="rounded-full border border-border/50 bg-card/60 px-3 py-1 text-sm text-muted-foreground">
          {entries.length} card{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {entries.map((entry) => (
          <CardThumbnail key={entry.id} card={entry.card} />
        ))}
      </div>
    </div>
  )
}
