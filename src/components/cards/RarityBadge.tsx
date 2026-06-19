import { Rarity } from '@/generated/prisma/client'
import { RARITY_BADGE_COLORS, RARITY_LABELS } from '@/lib/rarity'
import { cn } from '@/lib/utils'

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-semibold',
        RARITY_BADGE_COLORS[rarity],
        className
      )}
    >
      {RARITY_LABELS[rarity]}
    </span>
  )
}
