'use client'

import { useState, useMemo } from 'react'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import { CardDetailModal } from '@/components/cards/CardDetailModal'
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
  const [selected, setSelected] = useState<CardEntry | null>(null)

  const copiesByCardId = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach((e) => { map[e.cardId] = (map[e.cardId] ?? 0) + 1 })
    return map
  }, [entries])

  const filtered = useMemo(() => {
    let list = rarityFilter ? entries.filter((e) => e.card.rarity === rarityFilter) : entries
    if (sort === 'rarity') list = [...list].sort((a, b) => (RARITY_ORDER[a.card.rarity] ?? 5) - (RARITY_ORDER[b.card.rarity] ?? 5))
    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime())
    if (sort === 'name') list = [...list].sort((a, b) => a.card.name.localeCompare(b.card.name))
    return list
  }, [entries, rarityFilter, sort])

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button
            onClick={() => setRarityFilter('')}
            className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${!rarityFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(rarityFilter === r ? '' : r)}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${rarityFilter === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {RARITY_LABELS[r]}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs rounded-md border border-border bg-background px-2 py-1.5 text-muted-foreground"
        >
          <option value="rarity">Sort: Rarity</option>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: A–Z</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((entry) => (
          <CardThumbnail
            key={entry.id}
            card={{ ...entry.card, rarity: entry.card.rarity as Rarity }}
            onClick={() => setSelected(entry)}
          />
        ))}
      </div>

      <CardDetailModal
        entry={selected}
        copies={selected ? (copiesByCardId[selected.cardId] ?? 1) : 0}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
