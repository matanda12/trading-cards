import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { RarityBadge } from '@/components/cards/RarityBadge'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Button variant="outline" render={<Link href="/marketplace/sell" />}>Sell a Card</Button>
      </div>

      {listings.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No listings yet. Be the first to sell!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow block"
            >
              <div className="relative aspect-[5/7]">
                <Image
                  src={listing.card.imageUrl}
                  alt={listing.card.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-semibold truncate">{listing.card.name}</p>
                <RarityBadge rarity={listing.card.rarity as Rarity} />
                <p className="text-sm font-bold">${(listing.priceCents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {listing.seller.id === user.id ? 'Your listing' : listing.seller.name ?? listing.seller.email}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
