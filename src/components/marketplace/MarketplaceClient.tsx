'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { RarityBadge } from '@/components/cards/RarityBadge'
import { RARITY_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

const RARITIES: Rarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']
const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare', EPIC: 'Epic', LEGENDARY: 'Legendary',
}

type Listing = {
  id: string
  priceCents: number
  createdAt: string
  card: { name: string; rarity: string; imageUrl: string }
  seller: { id: string; name: string | null; username: string | null }
}

type SortOption = 'newest' | 'price-asc' | 'price-desc'

export function MarketplaceClient({
  listings,
  currentUserId,
}: {
  listings: Listing[]
  currentUserId: string
}) {
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('newest')

  const filtered = useMemo(() => {
    let list = listings
    if (search) list = list.filter((l) => l.card.name.toLowerCase().includes(search.toLowerCase()))
    if (rarity) list = list.filter((l) => l.card.rarity === rarity)
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents)
    return list
  }, [listings, search, rarity, sort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-44"
        />
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setRarity('')}
            className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${!rarity ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarity(rarity === r ? '' : r)}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${rarity === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
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
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-16 text-center">
          <p className="text-muted-foreground text-sm">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className={`group rounded-xl border-2 overflow-hidden hover:scale-[1.02] hover:brightness-110 transition-all duration-200 block ${RARITY_COLORS[listing.card.rarity as Rarity]}`}
            >
              <div className="relative aspect-[5/7]">
                <Image
                  src={listing.card.imageUrl}
                  alt={listing.card.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-6">
                  <p className="text-white text-xs font-bold truncate">{listing.card.name}</p>
                  <RarityBadge rarity={listing.card.rarity as Rarity} />
                </div>
              </div>
              <div className="bg-card/80 p-2 space-y-0.5">
                <p className="text-sm font-bold text-green-400">${(listing.priceCents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {listing.seller.id === currentUserId ? 'Your listing' : (listing.seller.username ? `@${listing.seller.username}` : (listing.seller.name ?? 'Unknown'))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
