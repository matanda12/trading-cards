'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Rarity } from '@/generated/prisma/client'
import { RARITY_COLORS } from '@/lib/rarity'
import { RarityBadge } from './RarityBadge'
import { Button } from '@/components/ui/button'
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
  entry: Entry | null
  copies: number
  onClose: () => void
}

export function CardDetailModal({ entry, copies, onClose }: Props) {
  return (
    <Dialog open={!!entry} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-black">{entry.card.name}</DialogTitle>
            </DialogHeader>

            <div className={`relative aspect-[5/7] rounded-xl overflow-hidden border-2 ${RARITY_COLORS[entry.card.rarity as Rarity]}`}>
              <Image
                src={entry.card.imageUrl}
                alt={entry.card.name}
                fill
                className="object-cover"
                sizes="300px"
              />
            </div>

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
                <span className="font-bold text-primary">{copies}</span>{' '}
                {copies === 1 ? 'copy' : 'copies'}
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
