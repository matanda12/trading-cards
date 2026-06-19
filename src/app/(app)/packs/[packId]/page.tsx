import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PackOpener } from '@/components/packs/PackOpener'
import { RarityBadge } from '@/components/cards/RarityBadge'
import { RARITY_WEIGHTS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ packId: string }>
}) {
  const user = await requireAuth()
  const { packId } = await params

  const [pack, dbUser] = await Promise.all([
    prisma.pack.findUnique({
      where: { id: packId, isActive: true },
      include: { slots: { include: { card: true } } },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { coinBalance: true } }),
  ])

  if (!pack) notFound()

  const totalWeight = pack.slots.reduce((sum, s) => sum + s.weight, 0)
  const coinBalance = dbUser?.coinBalance ?? 0
  const canAfford = coinBalance >= pack.coinCost

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{pack.name}</h1>
        {pack.description && <p className="text-muted-foreground">{pack.description}</p>}
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">{pack.coinCost.toLocaleString()} coins</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">{pack.cardCount} cards per open</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-sm">
            Your balance: <span className={canAfford ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
              {coinBalance.toLocaleString()} coins
            </span>
          </span>
        </div>
      </div>

      <PackOpener packId={pack.id} coinCost={pack.coinCost} canAfford={canAfford} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Cards in this pack</h2>
        <div className="border rounded-lg divide-y">
          {pack.slots
            .sort((a, b) => b.weight - a.weight)
            .map((slot) => {
              const pct = totalWeight > 0 ? ((slot.weight / totalWeight) * 100).toFixed(1) : '0'
              return (
                <div key={slot.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{slot.card.name}</p>
                    <RarityBadge rarity={slot.card.rarity as Rarity} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{pct}%</p>
                    <p className="text-xs text-muted-foreground">chance</p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
