import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { SellForm } from './SellForm'

export default async function SellPage() {
  const user = await requireAuth()

  const entries = await prisma.collectionEntry.findMany({
    where: {
      userId: user.id,
      card: { isActive: true },
      listing: null,
      tradeItem: null,
    },
    include: { card: true },
    orderBy: { obtainedAt: 'desc' },
  })

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Sell a Card</h1>
      {entries.length === 0 ? (
        <p className="text-muted-foreground">No available cards to sell. All your cards are either listed or in a trade.</p>
      ) : (
        <SellForm entries={entries} />
      )}
    </div>
  )
}
