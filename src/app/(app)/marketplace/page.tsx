import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketplaceClient } from '@/components/marketplace/MarketplaceClient'

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

  // Serialize for client component
  const serialized = listings.map((l) => ({
    id: l.id,
    priceCents: l.priceCents,
    createdAt: l.createdAt.toISOString(),
    card: { name: l.card.name, rarity: l.card.rarity, imageUrl: l.card.imageUrl },
    seller: { id: l.seller.id, name: l.seller.name, email: l.seller.email },
  }))

  return (
    <div className="space-y-6">
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
        <MarketplaceClient listings={serialized} currentUserId={user.id} />
      )}
    </div>
  )
}
