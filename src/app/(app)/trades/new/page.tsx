import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NewTradeForm } from './NewTradeForm'

export default async function NewTradePage() {
  const user = await requireAuth()

  const myEntries = await prisma.collectionEntry.findMany({
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
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Trade Offer</h1>
      <NewTradeForm myEntries={myEntries} currentUserId={user.id} />
    </div>
  )
}
