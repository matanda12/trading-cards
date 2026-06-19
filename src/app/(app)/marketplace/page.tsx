import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { RarityBadge } from '@/components/cards/RarityBadge'
import { RARITY_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

export default async function MarketplacePage() {
  const user = await requireAuth()

  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', card: { isActive: true } },
    include: {
      card: true,
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 48,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Marketplace</p>
          <h1 className="text-3xl font-black tracking-tight">Buy &amp; Sell Cards</h1>
        </div>
        <Button variant="outline" render={<Link href="/marketplace/sell" />}>
          Sell a Card
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-16 text-center">
          <p className="text-4xl mb-3">🏪</p>
          <p className="font-semibold mb-1">No listings yet</p>
          <p className="text-muted-foreground text-sm">Be the first to list a card for sale.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className={`group rounded-xl border-2 overflow-hidden hover:scale-[1.02] hover:brightness-110 transition-all duration-200 block ${RARITY_COLORS[listing.card.rarity as Rarity]}`}
            >
              <div className="relative aspect-[5/7]">
                <Image
                  src={listing.card.imageUrl}
                  alt={listing.card.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-6">
                  <p className="text-white text-xs font-bold truncate">{listing.card.name}</p>
                  <RarityBadge rarity={listing.card.rarity as Rarity} />
                </div>
              </div>
              <div className="bg-card/80 p-2 space-y-0.5">
                <p className="text-sm font-bold text-green-400">${(listing.priceCents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {listing.seller.id === user.id ? 'Your listing' : (listing.seller.name ?? listing.seller.email)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
