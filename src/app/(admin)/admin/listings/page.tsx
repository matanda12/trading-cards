import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'
import { CancelListingAdminButton } from './CancelListingAdminButton'

export default async function AdminListingsPage() {
  await requireAdmin()

  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    include: {
      card: true,
      seller: { select: { name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Active Listings</h1>
        <span className="text-sm text-muted-foreground">{listings.length} listings</span>
      </div>

      {listings.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No active listings.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Card</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Seller</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Listed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{listing.card.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[listing.card.rarity as Rarity]}`}>
                        {listing.card.rarity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {listing.seller.username ? `@${listing.seller.username}` : (listing.seller.name ?? 'Unknown')}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-400">
                    ${(listing.priceCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CancelListingAdminButton listingId={listing.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
