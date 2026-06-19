'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Card = { id: string; name: string; imageUrl: string; rarity: string }
type Phase = 'IDLE' | 'OPENING' | 'REVEALING' | 'DONE'

const rarityBorder: Record<string, string> = {
  LEGENDARY: 'border-yellow-400',
  EPIC: 'border-purple-500',
  RARE: 'border-blue-500',
  UNCOMMON: 'border-green-400',
  COMMON: 'border-slate-500',
}

const rarityGlow: Record<string, string> = {
  LEGENDARY: 'animate-legendary-glow',
  EPIC: 'animate-epic-glow',
}

const BASE_DELAY = 800
const STAGGER = 750

export function PackOpener({ packId, coinCost, canAfford }: {
  packId: string
  coinCost: number
  canAfford: boolean
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('IDLE')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [shaking, setShaking] = useState<number | null>(null)
  const [flash, setFlash] = useState<'gold' | 'purple' | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function schedule(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => () => clearAll(), [])

  useEffect(() => {
    if (phase !== 'REVEALING' || cards.length === 0) return
    clearAll()

    cards.forEach((card, i) => {
      const flipAt = BASE_DELAY + i * STAGGER
      const isRare = card.rarity === 'LEGENDARY' || card.rarity === 'EPIC'

      if (isRare) {
        const flashColor = card.rarity === 'LEGENDARY' ? 'gold' : 'purple'
        schedule(() => {
          setFlash(flashColor)
          timers.current.push(setTimeout(() => setFlash(null), 700))
        }, flipAt - 700)
        schedule(() => setShaking(i), flipAt - 350)
        schedule(() => setShaking(null), flipAt + 50)
      }

      schedule(() => {
        setFlipped((p) => new Set([...p, i]))
      }, flipAt)
    })

    const doneAt = BASE_DELAY + (cards.length - 1) * STAGGER + 900
    schedule(async () => {
      setPhase('DONE')
      if (cards.some((c) => c.rarity === 'LEGENDARY' || c.rarity === 'EPIC')) {
        const { default: confetti } = await import('canvas-confetti')
        const legendary = cards.some((c) => c.rarity === 'LEGENDARY')
        confetti({
          particleCount: legendary ? 180 : 100,
          spread: 90,
          origin: { y: 0.5 },
          colors: legendary
            ? ['#fbbf24', '#f59e0b', '#ffffff', '#fef3c7']
            : ['#a855f7', '#7c3aed', '#ffffff', '#ede9fe'],
        })
      }
    }, doneAt)
  }, [phase, cards])

  async function openPack() {
    if (phase === 'OPENING') return
    clearAll()
    setFlipped(new Set())
    setFlash(null)
    setShaking(null)
    setPhase('OPENING')
    setCards([])

    try {
      const res = await fetch(`/api/packs/${packId}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to open pack')
        setPhase('IDLE')
        return
      }
      setCards(data.cards)
      schedule(() => setPhase('REVEALING'), 350)
      router.refresh()
    } catch {
      toast.error('Network error')
      setPhase('IDLE')
    }
  }

  function reset() {
    clearAll()
    setPhase('IDLE')
    setCards([])
    setFlipped(new Set())
    setFlash(null)
    setShaking(null)
  }

  return (
    <div className="relative min-h-72 flex flex-col items-center">
      {/* Full-screen flash overlay for legendary/epic reveals */}
      {flash && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: flash === 'gold' ? 'rgba(251,191,36,0.22)' : 'rgba(168,85,247,0.20)',
            animation: 'flash-overlay 0.7s ease-out forwards',
          }}
        />
      )}

      {/* IDLE state */}
      {phase === 'IDLE' && (
        <div className="flex flex-col items-center gap-6 py-8 w-full">
          <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-400/70 shadow-xl shadow-purple-500/20 flex flex-col items-center justify-center gap-2 animate-float cursor-pointer select-none"
            onClick={canAfford ? openPack : undefined}
          >
            <p className="text-5xl">🃏</p>
            <p className="text-purple-300 text-xs font-bold tracking-[0.2em] uppercase">Card Pack</p>
          </div>
          <Button onClick={openPack} disabled={!canAfford} size="lg" className="w-52">
            {canAfford ? `Open (${coinCost.toLocaleString()} coins)` : 'Not enough coins'}
          </Button>
          {!canAfford && (
            <p className="text-sm text-muted-foreground">
              <Link href="/coins" className="text-purple-400 hover:underline">Buy coins</Link> to open packs.
            </p>
          )}
        </div>
      )}

      {/* OPENING state — pack burst animation */}
      {phase === 'OPENING' && (
        <div className="flex flex-col items-center gap-6 py-8 w-full">
          <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-400/70 shadow-xl shadow-purple-500/20 flex flex-col items-center justify-center gap-2 scale-150 opacity-0"
            style={{ transition: 'transform 0.3s, opacity 0.3s' }}
          >
            <p className="text-5xl">🃏</p>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Opening…</p>
        </div>
      )}

      {/* REVEALING / DONE state */}
      {(phase === 'REVEALING' || phase === 'DONE') && cards.length > 0 && (
        <div className="space-y-8 w-full">
          <h2 className="text-xl font-bold text-center">
            {phase === 'DONE' ? '✨ You got:' : 'Revealing…'}
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {cards.map((card, i) => {
              const isFlipped = flipped.has(i)
              const isShaking = shaking === i
              const border = rarityBorder[card.rarity] ?? 'border-slate-500'
              const glow = isFlipped ? (rarityGlow[card.rarity] ?? '') : ''

              return (
                <div
                  key={`${card.id}-${i}`}
                  className={`w-36 ${isShaking ? 'animate-shake' : ''}`}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Card back (face-down) */}
                    <div
                      className="rounded-xl overflow-hidden border-2 border-purple-500/50"
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
                    >
                      <div className="aspect-[5/7] bg-gradient-to-br from-purple-950 via-indigo-900 to-purple-950 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 opacity-25"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, rgba(168,85,247,0.3) 0px, rgba(168,85,247,0.3) 1px, transparent 1px, transparent 10px)',
                          }}
                        />
                        <p className="text-purple-300/80 font-black text-xl tracking-[0.3em] z-10 select-none">CV</p>
                      </div>
                      <div className="bg-black/60 p-2 text-center text-xs text-purple-300/60 font-semibold">
                        CardVault
                      </div>
                    </div>

                    {/* Card front (revealed) */}
                    <div
                      className={`absolute inset-0 rounded-xl overflow-hidden border-2 shadow-lg ${border} ${glow}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      } as React.CSSProperties}
                    >
                      <Image
                        src={card.imageUrl}
                        alt={card.name}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs font-semibold text-center">
                        {card.name}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {phase === 'DONE' && (
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={reset} variant="outline">Open Another</Button>
              <Button onClick={() => router.push('/collection')}>View Collection</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
