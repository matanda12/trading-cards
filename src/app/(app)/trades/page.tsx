import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const statusStyles: Record<string, string> = {
  PENDING:   'border-yellow-500/30  bg-yellow-500/10  text-yellow-300',
  ACCEPTED:  'border-green-500/30   bg-green-500/10   text-green-300',
  REJECTED:  'border-red-500/30     bg-red-500/10     text-red-300',
  CANCELLED: 'border-border         bg-muted/50       text-muted-foreground',
  EXPIRED:   'border-border         bg-muted/30       text-muted-foreground/60',
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

  function cardNames(trade: (typeof sent)[0] | (typeof received)[0], ownerId: string) {
    return trade.items
      .filter((i) => i.ownerId === ownerId)
      .map((i) => i.collectionEntry.card.name)
      .join(', ')
  }

  const pendingCount = received.filter((t) => t.status === 'PENDING').length
  const now = new Date()

  function expiryLabel(expiresAt: Date, status: string) {
    if (status !== 'PENDING') return null
    const diffMs = expiresAt.getTime() - now.getTime()
    if (diffMs <= 0) return 'Expired'
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 24) return `${diffHours}h left`
    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24))}d left`
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Trades</p>
          <h1 className="text-3xl font-black tracking-tight">Trade Offers</h1>
        </div>
        <Button render={<Link href="/trades/new" />}>+ New Trade</Button>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            Received
            {pendingCount > 0 && (
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-bold text-yellow-300">
                {pendingCount} pending
              </span>
            )}
          </h2>
          {received.length === 0 ? (
            <p className="text-muted-foreground text-sm">No received trade offers.</p>
          ) : (
            <div className="space-y-2">
              {received.map((trade) => (
                <Link
                  key={trade.id}
                  href={`/trades/${trade.id}`}
                  className="rounded-xl border border-border/50 bg-card/40 p-4 block hover:bg-card/70 hover:border-border transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        From: {trade.initiator.name ?? trade.initiator.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Offering: {cardNames(trade, trade.initiatorId) || '—'} · Wants: {cardNames(trade, user.id) || '—'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right space-y-0.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold block ${statusStyles[trade.status]}`}>
                        {trade.status}
                      </span>
                      {expiryLabel(trade.expiresAt, trade.status) && (
                        <span className="text-xs text-muted-foreground">{expiryLabel(trade.expiresAt, trade.status)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Sent</h2>
          {sent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sent trade offers.</p>
          ) : (
            <div className="space-y-2">
              {sent.map((trade) => (
                <Link
                  key={trade.id}
                  href={`/trades/${trade.id}`}
                  className="rounded-xl border border-border/50 bg-card/40 p-4 block hover:bg-card/70 hover:border-border transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        To: {trade.receiver.name ?? trade.receiver.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Offering: {cardNames(trade, user.id) || '—'} · Wants: {cardNames(trade, trade.receiverId) || '—'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right space-y-0.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold block ${statusStyles[trade.status]}`}>
                        {trade.status}
                      </span>
                      {expiryLabel(trade.expiresAt, trade.status) && (
                        <span className="text-xs text-muted-foreground">{expiryLabel(trade.expiresAt, trade.status)}</span>
                      )}
                    </div>
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
