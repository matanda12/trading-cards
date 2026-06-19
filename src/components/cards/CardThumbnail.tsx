'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Rarity } from '@/generated/prisma/client'
import { RARITY_COLORS } from '@/lib/rarity'
import { RarityBadge } from './RarityBadge'
import { cn } from '@/lib/utils'

type CardLike = {
  id: string
  name: string
  imageUrl: string
  rarity: Rarity
  description?: string | null
}

type Props = {
  card: CardLike
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

export function CardThumbnail({ card, selected, onClick, compact = false }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const isInteractive = !!onClick

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ x: (y - 0.5) * -14, y: (x - 0.5) * 14 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
  }

  const isIdle = tilt.x === 0 && tilt.y === 0

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isIdle ? 'transform 0.4s ease' : 'transform 0.08s ease-out',
      }}
      className={cn(
        'relative rounded-xl border-2 overflow-hidden',
        RARITY_COLORS[card.rarity],
        isInteractive && 'cursor-pointer hover:brightness-110',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-95',
        compact ? 'w-24' : 'w-full aspect-[5/7]'
      )}
    >
      <div className={cn('relative w-full', compact ? 'aspect-[5/7]' : 'aspect-[5/7]')}>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      </div>
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-6">
          <p className="text-white text-xs font-bold truncate drop-shadow">{card.name}</p>
          <RarityBadge rarity={card.rarity} />
        </div>
      )}
    </div>
  )
}
