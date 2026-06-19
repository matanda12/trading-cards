import { Rarity } from '@/generated/prisma/client'

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  COMMON: 60,
  UNCOMMON: 25,
  RARE: 10,
  EPIC: 4,
  LEGENDARY: 1,
}

export const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: 'border-slate-400 shadow-slate-400/20',
  UNCOMMON: 'border-green-400 shadow-green-400/20',
  RARE: 'border-blue-500 shadow-blue-500/30',
  EPIC: 'border-purple-500 shadow-purple-500/30',
  LEGENDARY: 'border-yellow-400 shadow-yellow-400/40',
}

export const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
}

export const RARITY_BADGE_COLORS: Record<Rarity, string> = {
  COMMON: 'bg-slate-500 text-white',
  UNCOMMON: 'bg-green-500 text-white',
  RARE: 'bg-blue-600 text-white',
  EPIC: 'bg-purple-600 text-white',
  LEGENDARY: 'bg-yellow-500 text-black',
}
