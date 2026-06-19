'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Rarity } from '@/generated/prisma/client'
import { RARITY_COLORS } from '@/lib/rarity'
import { RarityBadge } from './RarityBadge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CardLike = {
  id: string
  name: string
  imageUrl: string
  rarity: string
  category?: string
  description?: string | null
}

type Entry = {
  id: string
  cardId: string
  card: CardLike
}

type Props = {
  entries: Entry[]
  index: number | null
  copiesByCardId: Record<string, number>
  onClose: () => void
  onNavigate: (index: number) => void
}

export function CardDetailModal({ entries, index, copiesByCardId, onClose, onNavigate }: Props) {
  const entry = index !== null ? entries[index] : null
  const hasPrev = index !== null && index > 0
  const hasNext = index !== null && index < entries.length - 1
  const touchStartX = useRef<number | null>(null)

  // Keyboard arrow navigation
  useEffect(() => {
    if (index === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index! - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index! + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, hasPrev, hasNext, onNavigate])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || index === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (diff > 50 && hasPrev) onNavigate(index - 1)
    if (diff < -50 && hasNext) onNavigate(index + 1)
  }

  return (
    <Dialog open={index !== null} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-black pr-8">{entry.card.name}</DialogTitle>
            </DialogHeader>

            {/* Card image with swipe zone and nav arrows */}
            <div
              className="relative select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`relative aspect-[5/7] rounded-xl overflow-hidden border-2 ${RARITY_COLORS[entry.card.rarity as Rarity]}`}>
                <Image
                  src={entry.card.imageUrl}
                  alt={entry.card.name}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              </div>

              {/* Prev arrow */}
              <button
                onClick={() => hasPrev && onNavigate(index! - 1)}
                disabled={!hasPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 text-white transition-all hover:bg-black/80 disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Previous card"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Next arrow */}
              <button
                onClick={() => hasNext && onNavigate(index! + 1)}
                disabled={!hasNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 text-white transition-all hover:bg-black/80 disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Next card"
              >
                <ChevronRight size={20} />
              </button>

              {/* Position indicator */}
              {entries.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 font-medium">
                  {index! + 1} / {entries.length}
                </div>
              )}
            </div>

            {/* Dot indicators for small collections */}
            {entries.length > 1 && entries.length <= 12 && (
              <div className="flex justify-center gap-1.5 -mt-1">
                {entries.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(i)}
                    className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                    aria-label={`Go to card ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RarityBadge rarity={entry.card.rarity as Rarity} />
                {entry.card.category && (
                  <span className="text-xs text-muted-foreground">{entry.card.category}</span>
                )}
              </div>

              {entry.card.description && (
                <p className="text-sm text-muted-foreground">{entry.card.description}</p>
              )}

              <p className="text-sm">
                You own{' '}
                <span className="font-bold text-primary">{copiesByCardId[entry.cardId] ?? 1}</span>{' '}
                {(copiesByCardId[entry.cardId] ?? 1) === 1 ? 'copy' : 'copies'}
              </p>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" render={<Link href="/marketplace/sell" />}>
                  Sell
                </Button>
                <Button size="sm" className="flex-1" render={<Link href="/trades/new" />}>
                  Trade
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
