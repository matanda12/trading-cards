'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Rarity } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'

type CardLike = {
  id: string
  name: string
  imageUrl: string
  rarity: Rarity
  category?: string | null
  description?: string | null
}

type Props = {
  card: CardLike
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

const BORDER_COLORS: Record<Rarity, string> = {
  COMMON:    'border-slate-500/60',
  UNCOMMON:  'border-green-400/70',
  RARE:      'border-blue-400/80',
  EPIC:      'border-purple-400/90',
  LEGENDARY: 'border-amber-400',
}

const GLOW_CLASSES: Record<Rarity, string> = {
  COMMON:    '',
  UNCOMMON:  'shadow-[0_0_12px_rgba(74,222,128,0.3)]',
  RARE:      'shadow-[0_0_16px_rgba(96,165,250,0.4)]',
  EPIC:      'animate-epic-glow',
  LEGENDARY: 'animate-legendary-glow',
}

const BADGE_COLORS: Record<Rarity, string> = {
  COMMON:    'bg-slate-600/80 text-slate-200',
  UNCOMMON:  'bg-green-600/80 text-green-100',
  RARE:      'bg-blue-600/80 text-blue-100',
  EPIC:      'bg-purple-600/80 text-purple-100',
  LEGENDARY: 'bg-amber-500/80 text-amber-100',
}

const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
}

export function CardThumbnail({ card, selected, onClick, compact = false }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const isInteractive = !!onClick

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ x: (y - 0.5) * -12, y: (x - 0.5) * 12 })
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
        'relative rounded-xl border-2 overflow-hidden aspect-[5/7]',
        BORDER_COLORS[card.rarity],
        GLOW_CLASSES[card.rarity],
        isInteractive && 'cursor-pointer hover:scale-[1.03] transition-transform',
        selected && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#080810] scale-95',
        compact && 'w-24'
      )}
    >
      <Image
        src={card.imageUrl}
        alt={card.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 200px"
      />

      {!compact && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
      )}

      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          {card.category && (
            <p className="font-cinzel text-[9px] tracking-widest uppercase text-slate-400 mb-0.5">
              {card.category}
            </p>
          )}
          <p className="font-cinzel text-xs font-bold text-white truncate leading-tight mb-1.5">
            {card.name}
          </p>
          <span className={cn('inline-block text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase', BADGE_COLORS[card.rarity])}>
            {RARITY_LABELS[card.rarity]}
          </span>
        </div>
      )}
    </div>
  )
}
