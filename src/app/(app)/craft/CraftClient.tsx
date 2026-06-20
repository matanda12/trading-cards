'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Rarity } from '@/generated/prisma/client'
import { RarityBadge } from '@/components/cards/RarityBadge'

type Entry = {
  id: string
  cardId: string
  copies: number
  card: {
    id: string
    name: string
    imageUrl: string
    rarity: string
    category: string
    description: string | null
  }
}

type ResultCard = { name: string; imageUrl: string; rarity: string }

export function CraftClient({ entries }: { entries: Entry[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [crafting, setCrafting] = useState(false)
  const [result, setResult] = useState<ResultCard | null>(null)
  const [error, setError] = useState('')

  // Dedupe by cardId for display, show all individual entries to pick from
  // Group by cardId for the grid, show "×N" badge
  const seen = new Set<string>()
  const dedupedForGrid: Entry[] = []
  const entriesByCardId: Record<string, Entry[]> = {}
  for (const e of entries) {
    if (!entriesByCardId[e.cardId]) entriesByCardId[e.cardId] = []
    entriesByCardId[e.cardId].push(e)
    if (!seen.has(e.cardId)) {
      seen.add(e.cardId)
      dedupedForGrid.push(e)
    }
  }

  function toggleCard(cardId: string) {
    if (result) return
    const cardEntries = entriesByCardId[cardId] ?? []
    const alreadySelected = [...selected].filter((id) => cardEntries.some((e) => e.id === id))

    setSelected((prev) => {
      const next = new Set(prev)
      if (alreadySelected.length > 0) {
        alreadySelected.forEach((id) => next.delete(id))
      } else {
        if (next.size >= 3) return prev
        // Pick the first unselected entry for this card
        const available = cardEntries.find((e) => !next.has(e.id))
        if (available) next.add(available.id)
      }
      return next
    })
  }

  async function craft() {
    if (selected.size !== 3) return
    setCrafting(true)
    setError('')
    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryIds: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Crafting failed'); return }
      setResult(data.card)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setCrafting(false)
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="text-4xl">✨</div>
        <h2 className="font-cinzel text-2xl font-black text-white">Crafting Complete!</h2>
        <div className="relative w-36 aspect-[5/7] rounded-xl overflow-hidden border-2 border-green-400/70 shadow-[0_0_30px_rgba(74,222,128,0.4)]">
          <Image src={result.imageUrl} alt={result.name} fill className="object-cover" sizes="144px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-cinzel text-xs font-bold text-white truncate mb-1">{result.name}</p>
            <RarityBadge rarity={result.rarity as Rarity} />
          </div>
        </div>
        <button
          onClick={() => { setSelected(new Set()); setResult(null); router.refresh() }}
          className="px-5 py-2 rounded-lg bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
        >
          Craft Again
        </button>
      </div>
    )
  }

  if (entries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="text-5xl">🔨</div>
        <div>
          <h2 className="text-xl font-bold">Not enough Common cards</h2>
          <p className="text-muted-foreground text-sm mt-1">You need at least 3 unlocked Common cards to craft.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">Selected: {selected.size} / 3</p>
          <p className="text-xs text-slate-500 mt-0.5">Click cards to select them. Choose any 3 Common cards.</p>
        </div>
        <button
          onClick={craft}
          disabled={selected.size !== 3 || crafting}
          className="px-5 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 hover:-translate-y-0.5"
        >
          {crafting ? 'Crafting…' : '🔨 Craft Uncommon'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {dedupedForGrid.map((entry) => {
          const cardEntries = entriesByCardId[entry.cardId] ?? []
          const selectedCount = [...selected].filter((id) => cardEntries.some((e) => e.id === id)).length
          const isSelected = selectedCount > 0
          return (
            <button
              key={entry.cardId}
              onClick={() => toggleCard(entry.cardId)}
              disabled={!isSelected && selected.size >= 3}
              className={`relative rounded-xl border-2 overflow-hidden aspect-[5/7] transition-all ${isSelected ? 'border-green-400 scale-95 shadow-[0_0_16px_rgba(74,222,128,0.5)]' : 'border-slate-500/60 hover:border-slate-400 hover:scale-[1.02]'} disabled:opacity-40`}
            >
              <Image src={entry.card.imageUrl} alt={entry.card.name} fill className="object-cover" sizes="200px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="font-cinzel text-xs font-bold text-white truncate mb-1">{entry.card.name}</p>
              </div>
              {entry.copies > 1 && (
                <div className="absolute top-1.5 right-1.5 rounded-full bg-purple-600/90 text-white text-xs font-bold px-1.5 py-0.5 min-w-[1.5rem] text-center">
                  ×{entry.copies}
                </div>
              )}
              {isSelected && (
                <div className="absolute top-1.5 left-1.5 rounded-full bg-green-500/90 text-white text-xs font-bold px-1.5 py-0.5">
                  ✓{selectedCount > 1 ? ` ×${selectedCount}` : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
