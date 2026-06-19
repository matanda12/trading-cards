import Image from 'next/image'
import { Card } from '@/generated/prisma/client'
import { RARITY_COLORS } from '@/lib/rarity'
import { RarityBadge } from './RarityBadge'
import { cn } from '@/lib/utils'

type Props = {
  card: Card
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

export function CardThumbnail({ card, selected, onClick, compact = false }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-150',
        RARITY_COLORS[card.rarity],
        selected && 'ring-2 ring-primary ring-offset-2 scale-95',
        onClick && 'hover:scale-105',
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-xs font-semibold truncate">{card.name}</p>
          <RarityBadge rarity={card.rarity} />
        </div>
      )}
    </div>
  )
}
