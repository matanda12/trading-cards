import Image from 'next/image'
import { Rarity } from '@/generated/prisma/client'
import { RARITY_COLORS } from '@/lib/rarity'
import { RarityBadge } from './RarityBadge'
import { cn } from '@/lib/utils'

// Minimal card shape — compatible with Prisma Card and client-serialized data
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
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 overflow-hidden transition-all duration-200',
        RARITY_COLORS[card.rarity],
        onClick && 'cursor-pointer hover:scale-105 hover:brightness-110',
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
