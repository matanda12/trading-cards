import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

const RARITY_ORDER: Rarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']
const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare', EPIC: 'Epic', LEGENDARY: 'Legendary',
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  await requireAuth()
  const { userId } = await params

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      collectionEntries: {
        select: { card: { select: { rarity: true } } },
      },
    },
  })

  if (!profile) notFound()

  const totalCards = profile.collectionEntries.length
  const rarityCounts: Record<string, number> = {}
  for (const entry of profile.collectionEntries) {
    rarityCounts[entry.card.rarity] = (rarityCounts[entry.card.rarity] ?? 0) + 1
  }

  const displayName = profile.name ?? profile.email.split('@')[0]
  const initial = displayName[0].toUpperCase()
  const joined = profile.createdAt.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-lg mx-auto space-y-8 py-8">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-500/30">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-black">{displayName}</h1>
          <p className="text-sm text-muted-foreground">Member since {joined}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Collection</p>
          <p className="text-4xl font-black">{totalCards}</p>
          <p className="text-sm text-muted-foreground">card{totalCards !== 1 ? 's' : ''} total</p>
        </div>

        {totalCards > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rarity breakdown</p>
            {RARITY_ORDER.map((rarity) => {
              const count = rarityCounts[rarity] ?? 0
              if (count === 0) return null
              const pct = Math.round((count / totalCards) * 100)
              return (
                <div key={rarity} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[rarity]}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                    <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
