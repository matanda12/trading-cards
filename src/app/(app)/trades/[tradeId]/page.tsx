import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Rarity } from '@/generated/prisma/client'
import { TradeActions } from './TradeActions'
import Link from 'next/link'
import { Clock, CheckCircle, XCircle, Ban, Timer } from 'lucide-react'

const statusStyles: Record<string, string> = {
  PENDING:   'border-yellow-500/30  bg-yellow-500/10  text-yellow-300',
  ACCEPTED:  'border-green-500/30   bg-green-500/10   text-green-300',
  REJECTED:  'border-red-500/30     bg-red-500/10     text-red-300',
  CANCELLED: 'border-border         bg-muted/50       text-muted-foreground',
  EXPIRED:   'border-border         bg-muted/30       text-muted-foreground/60',
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING:   <Clock size={11} className="inline mr-1 -mt-px" />,
  ACCEPTED:  <CheckCircle size={11} className="inline mr-1 -mt-px" />,
  REJECTED:  <XCircle size={11} className="inline mr-1 -mt-px" />,
  CANCELLED: <Ban size={11} className="inline mr-1 -mt-px" />,
  EXPIRED:   <Timer size={11} className="inline mr-1 -mt-px" />,
}

function formatExpiresAt(expiresAt: Date): string {
  const diffMs = expiresAt.getTime() - Date.now()
  if (diffMs <= 0) return 'Expired'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) return `Expires in ${diffHours}h`
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `Expires in ${diffDays}d`
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ tradeId: string }>
}) {
  const user = await requireAuth()
  const { tradeId } = await params

  let trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      initiator: { select: { id: true, name: true, username: true } },
      receiver: { select: { id: true, name: true, username: true } },
      items: { include: { collectionEntry: { include: { card: true } } } },
    },
  })

  if (!trade) notFound()
  const isInitiator = trade.initiatorId === user.id
  const isReceiver = trade.receiverId === user.id
  if (!isInitiator && !isReceiver) notFound()

  // Lazily expire overdue PENDING trades
  if (trade.status === 'PENDING' && trade.expiresAt < new Date()) {
    trade = await prisma.trade.update({
      where: { id: tradeId },
      data: { status: 'EXPIRED' },
      include: {
        initiator: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        items: { include: { collectionEntry: { include: { card: true } } } },
      },
    })
  }

  const offered = trade.items.filter((i) => i.ownerId === trade.initiatorId)
  const wanted = trade.items.filter((i) => i.ownerId === trade.receiverId)

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Trade Offer</p>
          <h1 className="text-2xl font-black tracking-tight">Review Trade</h1>
        </div>
        <div className="text-right space-y-1">
          <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-semibold ${statusStyles[trade.status]}`}>
            {statusIcons[trade.status]}{trade.status}
          </span>
          {trade.status === 'PENDING' && (
            <p className="text-xs text-muted-foreground">{formatExpiresAt(trade.expiresAt)}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4 text-sm space-y-1">
        <p>
          From:{' '}
          <Link href={`/users/${trade.initiator.id}`} className="font-semibold hover:underline">
            {trade.initiator.username ? `@${trade.initiator.username}` : (trade.initiator.name ?? 'Unknown')}
          </Link>
        </p>
        <p>
          To:{' '}
          <Link href={`/users/${trade.receiver.id}`} className="font-semibold hover:underline">
            {trade.receiver.username ? `@${trade.receiver.username}` : (trade.receiver.name ?? 'Unknown')}
          </Link>
        </p>
        {trade.message && (
          <p className="text-muted-foreground italic mt-2">&ldquo;{trade.message}&rdquo;</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
            {trade.initiator.username ? `@${trade.initiator.username}` : (trade.initiator.name ?? 'Unknown')} offers
          </h2>
          <div className="space-y-2">
            {offered.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/50 bg-card/40 p-3">
                <p className="text-sm font-semibold">{item.collectionEntry.card.name}</p>
                <RarityBadge rarity={item.collectionEntry.card.rarity as Rarity} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
            {trade.receiver.username ? `@${trade.receiver.username}` : (trade.receiver.name ?? 'Unknown')} gives
          </h2>
          <div className="space-y-2">
            {wanted.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/50 bg-card/40 p-3">
                <p className="text-sm font-semibold">{item.collectionEntry.card.name}</p>
                <RarityBadge rarity={item.collectionEntry.card.rarity as Rarity} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {trade.status === 'PENDING' && (
        <TradeActions tradeId={trade.id} isInitiator={isInitiator} isReceiver={isReceiver} />
      )}
    </div>
  )
}
