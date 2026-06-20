'use client'

import { useState, useMemo } from 'react'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import { CardDetailModal } from '@/components/cards/CardDetailModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Layers } from 'lucide-react'
import type { Rarity } from '@/generated/prisma/client'

const RARITIES: Rarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']
const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare', EPIC: 'Epic', LEGENDARY: 'Legendary',
}
const RARITY_ORDER: Record<string, number> = {
  LEGENDARY: 0, EPIC: 1, RARE: 2, UNCOMMON: 3, COMMON: 4,
}

type CardEntry = {
  id: string
  cardId: string
  obtainedAt: string
  card: {
    id: string
    name: string
    imageUrl: string
    rarity: string
    category: string
    description: string | null
  }
}

type SortOption = 'rarity' | 'newest' | 'name'

export function CollectionClient({ entries }: { entries: CardEntry[] }) {
  const [rarityFilter, setRarityFilter] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('rarity')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // Total copies per card across the whole collection
  const copiesByCardId = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach((e) => { map[e.cardId] = (map[e.cardId] ?? 0) + 1 })
    return map
  }, [entries])

  // Sorted + filtered + deduplicated (one row per unique card)
  const dedupedFiltered = useMemo(() => {
    let list = rarityFilter ? entries.filter((e) => e.card.rarity === rarityFilter) : entries
    if (sort === 'rarity') list = [...list].sort((a, b) => (RARITY_ORDER[a.card.rarity] ?? 5) - (RARITY_ORDER[b.card.rarity] ?? 5))
    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime())
    if (sort === 'name') list = [...list].sort((a, b) => a.card.name.localeCompare(b.card.name))
    const seen = new Set<string>()
    return list.filter((e) => {
      if (seen.has(e.cardId)) return false
      seen.add(e.cardId)
      return true
    })
  }, [entries, rarityFilter, sort])

  const totalInFilter = rarityFilter ? entries.filter((e) => e.card.rarity === rarityFilter).length : entries.length

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap flex-1">
          <button
            onClick={() => setRarityFilter('')}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold tracking-wide transition-all ${!rarityFilter ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'}`}
          >
            All
          </button>
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(rarityFilter === r ? '' : r)}
              className={`text-xs px-4 py-1.5 rounded-full font-semibold tracking-wide transition-all ${rarityFilter === r ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'}`}
            >
              {RARITY_LABELS[r]}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-400 hover:border-white/20 transition-colors"
        >
          <option value="rarity">Sort: Rarity</option>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: A–Z</option>
        </select>
        <span className="text-xs text-slate-500">
          {dedupedFiltered.length} unique · {totalInFilter} total
        </span>
      </div>

      {dedupedFiltered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No cards match this filter"
          description="Try a different rarity or clear the filter."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {dedupedFiltered.map((entry, i) => {
            const count = copiesByCardId[entry.cardId] ?? 1
            return (
              <div key={entry.cardId} className="relative">
                <CardThumbnail
                  card={{ ...entry.card, rarity: entry.card.rarity as Rarity }}
                  onClick={() => setSelectedIdx(i)}
                />
                {count > 1 && (
                  <div className="absolute top-1.5 right-1.5 z-10 rounded-full bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 shadow-lg min-w-[1.5rem] text-center pointer-events-none">
                    ×{count}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CardDetailModal
        entries={dedupedFiltered}
        index={selectedIdx}
        copiesByCardId={copiesByCardId}
        onClose={() => setSelectedIdx(null)}
        onNavigate={setSelectedIdx}
      />
    </>
  )
}
