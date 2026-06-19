import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Rarity } from '@/generated/prisma/client'
import { BuyButton } from './BuyButton'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const user = await requireAuth()
  const { listingId } = await params

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      card: true,
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (!listing) notFound()

  const isOwner = listing.sellerId === user.id

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="relative aspect-[5/7] rounded-xl overflow-hidden shadow-lg">
        <Image src={listing.card.imageUrl} alt={listing.card.name} fill className="object-cover" sizes="400px" />
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{listing.card.name}</h1>
        <RarityBadge rarity={listing.card.rarity as Rarity} />
        {listing.card.description && (
          <p className="text-muted-foreground text-sm">{listing.card.description}</p>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Price</span>
          <span className="text-2xl font-bold">${(listing.priceCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Seller</span>
          <span>{listing.seller.name ?? listing.seller.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={listing.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}>
            {listing.status}
          </span>
        </div>

        {listing.status === 'ACTIVE' && (
          isOwner
            ? <p className="text-sm text-muted-foreground text-center">This is your listing.</p>
            : <BuyButton listingId={listing.id} />
        )}
        {listing.status === 'SOLD' && (
          <p className="text-sm text-green-600 font-medium text-center">This card has been sold.</p>
        )}
      </div>
    </div>
  )
}
