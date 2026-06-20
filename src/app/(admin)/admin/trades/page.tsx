import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'
import { CancelTradeButton } from './CancelTradeButton'

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  ACCEPTED:  'bg-green-500/10 text-green-400 border border-green-500/20',
  REJECTED:  'bg-red-500/10 text-red-400 border border-red-500/20',
  CANCELLED: 'bg-muted/20 text-muted-foreground border border-border/30',
  EXPIRED:   'bg-muted/20 text-muted-foreground border border-border/30',
}

export default async function AdminTradesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status } = await searchParams

  const trades = await prisma.trade.findMany({
    where: status && status !== 'ALL' ? { status: status as never } : undefined,
    include: {
      initiator: { select: { username: true, email: true } },
      receiver: { select: { username: true, email: true } },
      items: {
        include: { collectionEntry: { include: { card: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const tabs = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED']
  const activeTab = status ?? 'ALL'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <span className="text-sm text-muted-foreground">{trades.length} trades</span>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/admin/trades?status=${tab}`}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTab === tab
                ? 'bg-primary/20 border-primary/40 text-primary font-semibold'
                : 'border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/20'
            }`}
          >
            {tab}
          </a>
        ))}
      </div>

      {trades.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No trades found.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Initiator</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Receiver</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cards</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {trade.initiator.username ? `@${trade.initiator.username}` : trade.initiator.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {trade.receiver.username ? `@${trade.receiver.username}` : trade.receiver.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {trade.items.map((item) => (
                        <span
                          key={item.id}
                          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[item.collectionEntry.card.rarity as Rarity]}`}
                          title={item.collectionEntry.card.name}
                        >
                          {item.collectionEntry.card.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[trade.status]}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(trade.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trade.status === 'PENDING' && <CancelTradeButton tradeId={trade.id} />}
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
