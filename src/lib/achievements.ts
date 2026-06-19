type UserStats = {
  totalCards: number
  legendaryCount: number
  tradeCount: number
  listingCount: number
  packsOpened: number
  coinBalance: number
}

export type Achievement = {
  id: string
  name: string
  description: string
  emoji: string
  check: (stats: UserStats) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_card',
    name: 'First Card',
    description: 'Add your first card to your collection',
    emoji: '🃏',
    check: (s) => s.totalCards >= 1,
  },
  {
    id: 'collector_10',
    name: 'Collector',
    description: 'Own 10 cards',
    emoji: '📦',
    check: (s) => s.totalCards >= 10,
  },
  {
    id: 'collector_100',
    name: 'Hoarder',
    description: 'Own 100 cards',
    emoji: '🏛️',
    check: (s) => s.totalCards >= 100,
  },
  {
    id: 'first_legendary',
    name: 'Legendary Pull',
    description: 'Pull your first Legendary card',
    emoji: '⭐',
    check: (s) => s.legendaryCount >= 1,
  },
  {
    id: 'first_trade',
    name: 'Trader',
    description: 'Complete your first trade',
    emoji: '🤝',
    check: (s) => s.tradeCount >= 1,
  },
  {
    id: 'first_listing',
    name: 'Merchant',
    description: 'List a card for sale on the marketplace',
    emoji: '🏪',
    check: (s) => s.listingCount >= 1,
  },
  {
    id: 'pack_opener',
    name: 'Pack Addict',
    description: 'Open 10 packs',
    emoji: '🎁',
    check: (s) => s.packsOpened >= 10,
  },
  {
    id: 'coin_hoarder',
    name: 'Coin Hoarder',
    description: 'Hold 1,000 coins at once',
    emoji: '🪙',
    check: (s) => s.coinBalance >= 1000,
  },
]
