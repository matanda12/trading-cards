import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

export default async function AdminSalesPage() {
  await requireAdmin()

  const sales = await prisma.listing.findMany({
    where: { status: 'SOLD' },
    include: {
      card: true,
      seller: { select: { username: true, email: true } },
    },
    orderBy: { soldAt: 'desc' },
    take: 200,
  })

  const buyerIds = [...new Set(sales.map((s) => s.buyerId).filter(Boolean) as string[])]
  const buyers = buyerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: buyerIds } },
        select: { id: true, username: true, email: true },
      })
    : []
  const buyerMap = Object.fromEntries(buyers.map((b) => [b.id, b]))

  const totalRevenue = sales.reduce((sum, s) => sum + s.priceCents, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <span className="text-sm text-muted-foreground">{sales.length} sales</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">${(totalRevenue / 100).toFixed(2)}</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No completed sales yet.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Card</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Seller</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Buyer</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Sale Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sales.map((sale) => {
                const buyer = sale.buyerId ? buyerMap[sale.buyerId] : null
                return (
                  <tr key={sale.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sale.card.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[sale.card.rarity as Rarity]}`}>
                          {sale.card.rarity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sale.seller.username ? `@${sale.seller.username}` : sale.seller.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {buyer ? (buyer.username ? `@${buyer.username}` : buyer.email) : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-400">
                      ${(sale.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {sale.soldAt ? new Date(sale.soldAt).toLocaleDateString() : '—'}
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
