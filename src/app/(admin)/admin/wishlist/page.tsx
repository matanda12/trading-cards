import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

export default async function AdminWishlistPage() {
  await requireAdmin()

  const [wishlistCounts, ownerCounts, cards] = await Promise.all([
    prisma.wishlist.groupBy({
      by: ['cardId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
    }),
    prisma.collectionEntry.groupBy({
      by: ['cardId'],
      _count: { cardId: true },
    }),
    prisma.card.findMany({ select: { id: true, name: true, rarity: true } }),
  ])

  const ownerMap = Object.fromEntries(ownerCounts.map((o) => [o.cardId, o._count.cardId]))
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]))

  const rows = wishlistCounts
    .map((w, i) => {
      const card = cardMap[w.cardId]
      const owners = ownerMap[w.cardId] ?? 0
      const ratio = owners > 0 ? w._count.cardId / owners : w._count.cardId
      return { rank: i + 1, card, wishlistCount: w._count.cardId, ownerCount: owners, ratio }
    })
    .filter((r) => r.card)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wishlist Analytics</h1>
        <span className="text-sm text-muted-foreground">{rows.length} cards wishlisted</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Demand ratio = wishlist ÷ owners. Higher means the card is desired but hard to obtain.
        <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">amber = ratio &gt; 2</span>
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No wishlisted cards yet.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Card</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Wishlist</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Owners</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Demand Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row) => {
                const highDemand = row.ratio > 2
                return (
                  <tr
                    key={row.card.id}
                    className={`transition-colors ${highDemand ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-accent/10'}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{row.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.card.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[row.card.rarity as Rarity]}`}>
                          {row.card.rarity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">⭐ {row.wishlistCount}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.ownerCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${highDemand ? 'text-amber-400' : 'text-foreground'}`}>
                        {row.ratio.toFixed(1)}×
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
