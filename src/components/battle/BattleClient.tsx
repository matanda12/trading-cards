'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RARITY_COLORS, RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

type CardLike = {
  id: string
  name: string
  imageUrl: string
  rarity: string
  category: string
}

type Entry = {
  id: string
  cardId: string
  card: CardLike
}

type SavedDeckCard = {
  slot: number
  cardId: string
  card: CardLike
}

type Battle = {
  id: string
  winnerId: string | null
  challengerRoundsWon?: number
  opponentRoundsWon?: number
  foughtAt: string
  isAiOpponent: boolean
  opponent: { username: string | null; name: string | null } | null
}

type Props = {
  userId: string
  entries: Entry[]
  savedDeckCards: SavedDeckCard[]
  recentBattles: Battle[]
}

export function BattleClient({ userId, entries, savedDeckCards, recentBattles }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'deck' | 'history'>('deck')

  // Initialize slots from saved deck
  const initSlots = (): (CardLike | null)[] => {
    const arr: (CardLike | null)[] = [null, null, null, null, null]
    for (const dc of savedDeckCards) {
      if (dc.slot >= 1 && dc.slot <= 5) arr[dc.slot - 1] = dc.card
    }
    return arr
  }

  const ownedCardIds = new Set(entries.map((e) => e.card.id))
  const [slots, setSlots] = useState<(CardLike | null)[]>(initSlots)
  const [activeSlot, setActiveSlot] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [deckSaved, setDeckSaved] = useState(savedDeckCards.length === 5)
  const [battling, setBattling] = useState(false)

  const deckFull = slots.every((s) => s !== null)
  const deckCardIds = new Set(slots.filter(Boolean).map((c) => c!.id))

  // Faction synergy: 3+ same faction → +10 per card
  const factionCounts: Record<string, number> = {}
  for (const c of slots) if (c) factionCounts[c.category] = (factionCounts[c.category] ?? 0) + 1
  const activeSynergies = Object.entries(factionCounts).filter(([, n]) => n >= 3).map(([f]) => f)

  // Cards already in collection (for display)
  const availableEntries = entries.filter((e) => !deckCardIds.has(e.card.id))

  function handleCardClick(card: CardLike) {
    if (deckCardIds.has(card.id)) {
      // Remove from deck
      setSlots((prev) => {
        const next = [...prev]
        const idx = next.findIndex((s) => s?.id === card.id)
        if (idx !== -1) { next[idx] = null; setActiveSlot(idx) }
        return next
      })
      setDeckSaved(false)
      return
    }
    // Place into active slot, advance to next empty
    setSlots((prev) => {
      const next = [...prev]
      next[activeSlot] = card
      return next
    })
    setDeckSaved(false)
    // Advance to next empty slot
    const nextEmpty = slots.findIndex((s, i) => i > activeSlot && s === null)
    if (nextEmpty !== -1) setActiveSlot(nextEmpty)
    else {
      const firstEmpty = slots.findIndex((s, i) => i !== activeSlot && s === null)
      if (firstEmpty !== -1) setActiveSlot(firstEmpty)
    }
  }

  async function saveDeck() {
    if (!deckFull) return
    setSaving(true)
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: slots.map((card, i) => ({ cardId: card!.id, slot: i + 1 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to save deck'); return }
      toast.success('Deck saved!')
      setDeckSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function startBattle() {
    setBattling(true)
    try {
      const res = await fetch('/api/battle/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to start battle'); return }
      router.push(`/battle/${data.battleId}`)
    } finally {
      setBattling(false)
    }
  }

  if (entries.length < 5) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/20 p-10 text-center space-y-4">
        <p className="text-5xl">⚔️</p>
        <p className="text-lg font-semibold">You need at least 5 cards to battle</p>
        <p className="text-muted-foreground text-sm">Open packs or redeem codes to grow your collection.</p>
        <Link
          href="/packs"
          className="inline-block px-5 py-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/30 transition-colors"
        >
          Open Packs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1">
        {(['deck', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20 border border-transparent'
            }`}
          >
            {t === 'deck' ? '🃏 My Deck' : '📜 History'}
          </button>
        ))}
      </div>

      {tab === 'deck' && (
        <div className="space-y-6">
          {/* Deck slots */}
          <div>
            <p className="text-sm font-semibold mb-3 text-muted-foreground">Your Deck (5 cards)</p>
            <div className="grid grid-cols-5 gap-2">
              {slots.map((card, i) => {
                const isActive = activeSlot === i && !deckFull
                const isInvalid = card && !ownedCardIds.has(card.id)
                return (
                  <button
                    key={i}
                    onClick={() => { if (!card) setActiveSlot(i) }}
                    className={`relative aspect-[5/7] rounded-xl border-2 transition-all overflow-hidden ${
                      isInvalid
                        ? 'border-red-500'
                        : card
                        ? RARITY_COLORS[card.rarity as Rarity]
                        : isActive
                        ? 'border-primary border-dashed bg-primary/5'
                        : 'border-dashed border-border/40 bg-card/20'
                    }`}
                  >
                    {card ? (
                      <>
                        <Image src={card.imageUrl} alt={card.name} fill className="object-cover" sizes="80px" />
                        {isInvalid && (
                          <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                            <p className="text-xs text-red-300 text-center px-1 font-semibold">Traded away</p>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSlots(prev => { const n=[...prev]; n[i]=null; return n }); setDeckSaved(false); setActiveSlot(i) }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${isActive ? 'text-primary' : 'text-muted-foreground/30'}`}>
                        {i + 1}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={saveDeck}
              disabled={!deckFull || saving}
              className="px-5 py-2.5 rounded-xl border border-border/50 bg-card/40 text-sm font-semibold hover:bg-accent/20 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : '💾 Save Deck'}
            </button>
            {deckSaved && deckFull && (
              <button
                onClick={startBattle}
                disabled={battling}
                className="flex-1 px-5 py-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm font-bold hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {battling ? 'Finding opponent…' : '⚔️ Battle!'}
              </button>
            )}
          </div>

          {!deckFull && (
            <p className="text-xs text-muted-foreground">
              {activeSlot < 5 && `Click a card below to fill slot ${activeSlot + 1}`}
            </p>
          )}

          {/* Synergy active badges */}
          {activeSynergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeSynergies.map((f) => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold">
                  ✦ {f} Synergy active (+10 per card)
                </span>
              ))}
            </div>
          )}

          {/* Collection grid */}
          <div>
            <p className="text-sm font-semibold mb-3 text-muted-foreground">
              Your Collection ({entries.length} cards)
              {deckCardIds.size > 0 && (
                <span className="ml-2 text-primary">{deckCardIds.size} in deck</span>
              )}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {entries.map((entry) => {
                const inDeck = deckCardIds.has(entry.card.id)
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleCardClick(entry.card)}
                    className={`relative aspect-[5/7] rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                      inDeck
                        ? 'border-primary ring-2 ring-primary/40'
                        : RARITY_COLORS[entry.card.rarity as Rarity]
                    } ${!inDeck && deckFull ? 'opacity-40' : ''}`}
                    title={`${entry.card.name} (${entry.card.category})`}
                  >
                    <Image
                      src={entry.card.imageUrl}
                      alt={entry.card.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {inDeck && (
                      <div className="absolute inset-0 bg-primary/20 flex items-end justify-center pb-1">
                        <span className="text-xs bg-primary text-white px-1 rounded font-bold">✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Battle tips */}
          <div className="rounded-xl border border-border/30 bg-card/20 p-3 space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Battle Tips</p>
            <p>⚡ <span className="text-yellow-400">Round 3 — Power Round:</span> No luck. Pure skill wins.</p>
            <p>🔥 <span className="text-red-400">Round 5 — Final Clash:</span> Luck doubled.</p>
            <p>✦ <span className="text-purple-400">Synergy:</span> 3+ same-faction cards → +10 each.</p>
            <p>🏆 <span className="text-amber-400">Clean Sweep (5–0):</span> +100 coins.</p>
            <p className="pt-0.5">Faction Advantage (+15): Arcane→Shadow→Light→Iron→Fire→Nature→Water→Arcane</p>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {recentBattles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">⚔️</p>
              <p>No battles yet. Save your deck and battle!</p>
            </div>
          ) : (
            recentBattles.map((b) => {
              const won = b.winnerId === userId
              const tied = b.winnerId === null
              const oppLabel = b.isAiOpponent
                ? 'AI Opponent'
                : b.opponent?.username
                ? `@${b.opponent.username}`
                : (b.opponent?.name ?? 'Unknown')
              return (
                <Link
                  key={b.id}
                  href={`/battle/${b.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card/20 px-4 py-3 hover:bg-accent/10 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-sm">vs {oppLabel}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.foughtAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    won
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : tied
                      ? 'bg-muted/20 text-muted-foreground border-border/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {won ? 'WIN' : tied ? 'TIE' : 'LOSS'}
                  </span>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
