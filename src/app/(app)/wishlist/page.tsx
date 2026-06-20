import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import type { Rarity } from '@/generated/prisma/client'
import Link from 'next/link'

export default async function WishlistPage() {
  const user = await requireAuth()

  const items = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: { card: { include: { _count: { select: { collectionEntries: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Wishlist</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">My Wishlist</h1>
        <p className="text-slate-400 text-sm mt-1">Cards you want to obtain. Star a card in your collection to add it.</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="text-5xl">⭐</div>
          <div>
            <h2 className="text-xl font-bold">Your wishlist is empty</h2>
            <p className="text-muted-foreground text-sm mt-1">Star cards in your collection to add them here.</p>
          </div>
          <Link href="/collection" className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors">
            Browse Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <CardThumbnail
                card={{ ...item.card, rarity: item.card.rarity as Rarity }}
                ownerCount={item.card._count.collectionEntries}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
