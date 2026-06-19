import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Rarity } from '@/generated/prisma/client'
import { TradeActions } from './TradeActions'

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ tradeId: string }>
}) {
  const user = await requireAuth()
  const { tradeId } = await params

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      initiator: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
      items: { include: { collectionEntry: { include: { card: true } } } },
    },
  })

  if (!trade) notFound()
  const isInitiator = trade.initiatorId === user.id
  const isReceiver = trade.receiverId === user.id
  if (!isInitiator && !isReceiver) notFound()

  const offered = trade.items.filter((i) => i.ownerId === trade.initiatorId)
  const wanted = trade.items.filter((i) => i.ownerId === trade.receiverId)

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade Offer</h1>
        <span className={`text-sm px-3 py-1 rounded font-medium ${
          trade.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          trade.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          {trade.status}
        </span>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p>From: <span className="font-medium text-foreground">{trade.initiator.name ?? trade.initiator.email}</span></p>
        <p>To: <span className="font-medium text-foreground">{trade.receiver.name ?? trade.receiver.email}</span></p>
        {trade.message && <p className="italic">&ldquo;{trade.message}&rdquo;</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {trade.initiator.name ?? trade.initiator.email} offers
          </h2>
          <div className="space-y-2">
            {offered.map((item) => (
              <div key={item.id} className="border rounded p-2">
                <p className="text-sm font-medium">{item.collectionEntry.card.name}</p>
                <RarityBadge rarity={item.collectionEntry.card.rarity as Rarity} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {trade.receiver.name ?? trade.receiver.email} gives
          </h2>
          <div className="space-y-2">
            {wanted.map((item) => (
              <div key={item.id} className="border rounded p-2">
                <p className="text-sm font-medium">{item.collectionEntry.card.name}</p>
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
