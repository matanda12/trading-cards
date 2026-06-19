import { Rarity } from '@/generated/prisma/client'

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  COMMON: 60,
  UNCOMMON: 25,
  RARE: 10,
  EPIC: 4,
  LEGENDARY: 1,
}

export const RARITY_COLORS: Record<Rarity, string> = {
  COMMON:    'border-slate-400',
  UNCOMMON:  'border-green-400  shadow-md  shadow-green-400/25',
  RARE:      'border-blue-500   shadow-lg  shadow-blue-500/35',
  EPIC:      'border-purple-500 shadow-xl  shadow-purple-500/45',
  LEGENDARY: 'border-yellow-400 shadow-xl  shadow-yellow-400/55',
}

export const RARITY_LABELS: Record<Rarity, string> = {
  COMMON:    'Common',
  UNCOMMON:  'Uncommon',
  RARE:      'Rare',
  EPIC:      'Epic',
  LEGENDARY: 'Legendary',
}

export const RARITY_BADGE_COLORS: Record<Rarity, string> = {
  COMMON:    'bg-slate-500/30   text-slate-300  border border-slate-400/30',
  UNCOMMON:  'bg-green-500/20   text-green-300  border border-green-400/30',
  RARE:      'bg-blue-600/20    text-blue-300   border border-blue-500/30',
  EPIC:      'bg-purple-600/20  text-purple-300 border border-purple-500/30',
  LEGENDARY: 'bg-yellow-500/20  text-yellow-300 border border-yellow-400/40',
}
