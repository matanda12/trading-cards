'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Card = { id: string; name: string; imageUrl: string; rarity: string }

const rarityGlows: Record<string, string> = {
  LEGENDARY: 'border-yellow-400 animate-legendary-glow',
  EPIC: 'border-purple-500 animate-epic-glow',
  RARE: 'shadow-blue-500/40 border-blue-500',
  UNCOMMON: 'shadow-green-400/30 border-green-400',
  COMMON: 'border-slate-400',
}

export function PackOpener({
  packId,
  coinCost,
  canAfford,
}: {
  packId: string
  coinCost: number
  canAfford: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!revealed || cards.length === 0) return
    const hasRare = cards.some((c) => c.rarity === 'LEGENDARY' || c.rarity === 'EPIC')
    if (!hasRare) return
    import('canvas-confetti').then(({ default: confetti }) => {
      const isLegendary = cards.some((c) => c.rarity === 'LEGENDARY')
      confetti({
        particleCount: isLegendary ? 180 : 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: isLegendary
          ? ['#fbbf24', '#f59e0b', '#ffffff', '#fef3c7']
          : ['#a855f7', '#7c3aed', '#ffffff', '#ede9fe'],
      })
    })
  }, [revealed, cards])

  async function openPack() {
    setLoading(true)
    setCards([])
    setRevealed(false)
    try {
      const res = await fetch(`/api/packs/${packId}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to open pack')
        return
      }
      setCards(data.cards)
      setTimeout(() => setRevealed(true), 100)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (cards.length > 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-center">You got:</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {cards.map((card, i) => (
            <div
              key={`${card.id}-${i}`}
              className={`relative w-36 rounded-xl border-2 shadow-lg overflow-hidden transition-all duration-500 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} ${rarityGlows[card.rarity] ?? 'border-slate-400'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="relative aspect-[5/7]">
                <Image src={card.imageUrl} alt={card.name} fill className="object-cover" sizes="144px" />
              </div>
              <div className="bg-black/70 text-white p-2 text-xs font-semibold text-center">{card.name}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={() => { setCards([]); setRevealed(false) }} variant="outline">Open Another</Button>
          <Button onClick={() => router.push('/collection')}>View Collection</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-400 shadow-lg shadow-purple-500/30 flex items-center justify-center">
        <p className="text-white text-4xl">🃏</p>
      </div>
      <Button
        onClick={openPack}
        disabled={loading || !canAfford}
        size="lg"
        className="w-48"
      >
        {loading ? 'Opening…' : canAfford ? `Open (${coinCost.toLocaleString()} coins)` : 'Not enough coins'}
      </Button>
      {!canAfford && (
        <p className="text-sm text-muted-foreground">Contact an admin to receive coins.</p>
      )}
    </div>
  )
}
