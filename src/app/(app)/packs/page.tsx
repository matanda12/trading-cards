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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Card Packs</p>
          <h1 className="text-3xl font-black tracking-tight">Open a Pack</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400">
          🪙 {(dbUser?.coinBalance ?? 0).toLocaleString()} coins
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-16 text-center">
          <p className="text-4xl mb-3">🎴</p>
          <p className="text-muted-foreground">No packs available yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="group relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-card p-6 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-200 block overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
              <div className="relative space-y-3">
                <div className="text-3xl">{pack.imageUrl ? '🎴' : '✨'}</div>
                <div>
                  <h2 className="text-lg font-bold">{pack.name}</h2>
                  {pack.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{pack.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {pack.cardCount} cards · {pack.slots.length} in pool
                  </span>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                    🪙 {pack.coinCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
