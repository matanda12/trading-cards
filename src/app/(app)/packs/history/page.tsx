import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Rarity } from '@/generated/prisma/client'

export default async function PackHistoryPage() {
  const user = await requireAuth()

  const opens = await prisma.packOpen.findMany({
    where: { userId: user.id, openedAt: { not: null } },
    include: {
      pack: { select: { name: true } },
      cardsGiven: { select: { collectionEntryId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  // Collect all entry IDs so we can look up the cards in one query
  const allEntryIds = opens.flatMap((o) => o.cardsGiven.map((g) => g.collectionEntryId))
  const entries = await prisma.collectionEntry.findMany({
    where: { id: { in: allEntryIds } },
    include: { card: true },
  })
  const entryById = Object.fromEntries(entries.map((e) => [e.id, e]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Packs</p>
          <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Pack History</h1>
          <p className="text-slate-400 text-sm mt-1">Your last {opens.length} pack opens.</p>
        </div>
        <Link href="/packs" className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors">
          ← Back to Packs
        </Link>
      </div>

      {opens.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="text-5xl">📦</div>
          <div>
            <h2 className="text-xl font-bold">No packs opened yet</h2>
            <p className="text-muted-foreground text-sm mt-1">Open a pack to see your history here.</p>
          </div>
          <Link href="/packs" className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors">
            Browse Packs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {opens.map((open) => {
            const date = new Date(open.createdAt)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            const cards = open.cardsGiven.map((g) => entryById[g.collectionEntryId]?.card).filter(Boolean)
            const hasLegendary = cards.some((c) => c?.rarity === 'LEGENDARY')
            const hasEpic = cards.some((c) => c?.rarity === 'EPIC')

            return (
              <div key={open.id} className={`rounded-xl border p-4 space-y-3 ${hasLegendary ? 'border-amber-500/40 bg-amber-950/20' : hasEpic ? 'border-purple-500/30 bg-purple-950/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{open.pack.name}</span>
                    {hasLegendary && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">✨ Legendary!</span>}
                    {!hasLegendary && hasEpic && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">⚡ Epic!</span>}
                  </div>
                  <span className="text-xs text-slate-500">{dateStr} · {timeStr}</span>
                </div>
                {cards.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {cards.map((card, i) => card && (
                      <div key={i} className="relative w-16 aspect-[5/7] rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <Image src={card.imageUrl} alt={card.name} fill className="object-cover" sizes="64px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0.5 left-0 right-0 px-1">
                          <RarityBadge rarity={card.rarity as Rarity} className="text-[8px] px-1 py-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
