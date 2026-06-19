import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PacksPage() {
  const user = await requireAuth()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { coinBalance: true } })

  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: { slots: { include: { card: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Card Packs</h1>
        <span className="text-sm text-muted-foreground">
          Your balance: <span className="font-semibold text-foreground">{(dbUser?.coinBalance ?? 0).toLocaleString()} coins</span>
        </span>
      </div>

      {packs.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No packs available yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="border rounded-xl p-6 hover:shadow-md transition-shadow space-y-3 block"
            >
              <h2 className="text-lg font-semibold">{pack.name}</h2>
              {pack.description && <p className="text-sm text-muted-foreground">{pack.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{pack.cardCount} cards per open</span>
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                  {pack.coinCost.toLocaleString()} coins
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{pack.slots.length} unique cards in pool</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
