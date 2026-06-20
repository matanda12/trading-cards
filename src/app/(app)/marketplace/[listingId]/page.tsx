import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { RarityBadge } from '@/components/cards/RarityBadge'
import { RARITY_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'
import { BuyButton } from './BuyButton'
import { CancelListingButton } from './CancelListingButton'
import Link from 'next/link'

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const user = await requireAuth()
  const { listingId } = await params
  const { success } = await searchParams

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      card: true,
      seller: { select: { id: true, name: true, username: true } },
    },
  })

  if (!listing) notFound()

  const isOwner = listing.sellerId === user.id

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      {success === 'true' && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-300">Payment successful!</p>
          <p className="text-sm text-green-400/80 mt-0.5">
            {listing.card.name} has been added to your collection.{' '}
            <Link href="/collection" className="underline">View collection →</Link>
          </p>
        </div>
      )}

      <div className={`relative aspect-[5/7] rounded-2xl overflow-hidden border-2 shadow-2xl ${RARITY_COLORS[listing.card.rarity as Rarity]}`}>
        <Image src={listing.card.imageUrl} alt={listing.card.name} fill className="object-cover" sizes="400px" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12">
          <h1 className="text-white text-xl font-bold">{listing.card.name}</h1>
          <RarityBadge rarity={listing.card.rarity as Rarity} />
        </div>
      </div>

      {listing.card.description && (
        <p className="text-muted-foreground text-sm">{listing.card.description}</p>
      )}

      <div className="rounded-2xl border border-border/50 bg-card/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Price</span>
          <span className="text-3xl font-black text-green-400">${(listing.priceCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Seller</span>
          <span className="font-medium">{listing.seller.username ? `@${listing.seller.username}` : (listing.seller.name ?? 'Unknown')}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={listing.status === 'ACTIVE'
            ? 'text-green-400 font-semibold'
            : listing.status === 'SOLD'
            ? 'text-muted-foreground'
            : 'text-red-400'
          }>
            {listing.status}
          </span>
        </div>

        {listing.status === 'ACTIVE' && isOwner && (
          <CancelListingButton listingId={listing.id} />
        )}
        {listing.status === 'ACTIVE' && !isOwner && (
          <BuyButton listingId={listing.id} />
        )}
        {listing.status === 'SOLD' && (
          <p className="text-sm text-green-400 font-medium text-center pt-1">This card has been sold.</p>
        )}
        {listing.status === 'CANCELLED' && (
          <p className="text-sm text-muted-foreground text-center pt-1">This listing was cancelled.</p>
        )}
      </div>
    </div>
  )
}
