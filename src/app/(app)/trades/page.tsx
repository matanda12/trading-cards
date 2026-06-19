import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default async function TradesPage() {
  const user = await requireAuth()

  const [sent, received] = await Promise.all([
    prisma.trade.findMany({
      where: { initiatorId: user.id },
      include: {
        receiver: { select: { name: true, email: true } },
        items: { include: { collectionEntry: { include: { card: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trade.findMany({
      where: { receiverId: user.id },
      include: {
        initiator: { select: { name: true, email: true } },
        items: { include: { collectionEntry: { include: { card: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  function tradeCard(trade: (typeof sent)[0] | (typeof received)[0], ownerId: string) {
    return trade.items
      .filter((i) => i.ownerId === ownerId)
      .map((i) => i.collectionEntry.card.name)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <Button render={<Link href="/trades/new" />}>+ New Trade</Button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Received ({received.filter((t) => t.status === 'PENDING').length} pending)</h2>
          {received.length === 0 ? (
            <p className="text-muted-foreground text-sm">No received trade offers.</p>
          ) : (
            <div className="space-y-3">
              {received.map((trade) => (
                <Link key={trade.id} href={`/trades/${trade.id}`} className="border rounded-lg p-4 block hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        From: {trade.initiator.name ?? trade.initiator.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Offering: {tradeCard(trade, trade.initiatorId) || '—'} · Wants: {tradeCard(trade, user.id) || '—'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[trade.status]}`}>
                      {trade.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Sent</h2>
          {sent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sent trade offers.</p>
          ) : (
            <div className="space-y-3">
              {sent.map((trade) => (
                <Link key={trade.id} href={`/trades/${trade.id}`} className="border rounded-lg p-4 block hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        To: {trade.receiver.name ?? trade.receiver.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Offering: {tradeCard(trade, user.id) || '—'} · Wants: {tradeCard(trade, trade.receiverId) || '—'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[trade.status]}`}>
                      {trade.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
