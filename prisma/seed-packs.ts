/**
 * Seeds additional packs into the database.
 * Safe to re-run — skips packs that already exist by name.
 *
 * Usage:
 *   npx tsx prisma/seed-packs.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

// Weight values: higher = more likely to be drawn
const W = {
  LEGENDARY: 1,
  EPIC:      5,
  RARE:      20,
  UNCOMMON:  50,
  COMMON:    100,
}

// Premium weights (boosted rare+)
const W_PREMIUM = {
  LEGENDARY: 5,
  EPIC:      15,
  RARE:      35,
  UNCOMMON:  30,
  COMMON:    15,
}

// Faction-only weights (flat across rarities so every faction card is equally likely)
const W_FACTION = {
  LEGENDARY: 5,
  EPIC:      10,
  RARE:      20,
  UNCOMMON:  30,
  COMMON:    35,
}

const PACKS = [
  {
    name: 'Premium Pack',
    description: 'Boosted odds for Rare, Epic, and Legendary cards. Worth every coin.',
    coinCost: 300,
    cardCount: 5,
    weights: W_PREMIUM,
  },
  {
    name: 'Legendary Hunt',
    description: 'Maximum odds for Legendary and Epic pulls. For the serious collector.',
    coinCost: 600,
    cardCount: 5,
    weights: {
      LEGENDARY: 15,
      EPIC:      30,
      RARE:      35,
      UNCOMMON:  15,
      COMMON:    5,
    },
  },
]

async function main() {
  const allCards = await prisma.card.findMany({
    where: { isActive: true },
    select: { id: true, rarity: true, category: true },
  })

  console.log(`Found ${allCards.length} active cards\n`)

  for (const packDef of PACKS) {
    const existing = await prisma.pack.findFirst({ where: { name: packDef.name } })
    if (existing) {
      console.log(`⏭  Skipping "${packDef.name}" (already exists)`)
      continue
    }

    // Filter cards by faction if specified
    let cards = allCards
    if ('faction' in packDef && packDef.faction) {
      cards = allCards.filter(c => c.category === packDef.faction)
    } else if ('factions' in packDef && packDef.factions) {
      cards = allCards.filter(c => packDef.factions!.includes(c.category))
    }

    if (cards.length === 0) {
      console.log(`⚠  No cards found for "${packDef.name}" — skipping`)
      continue
    }

    const pack = await prisma.pack.create({
      data: {
        name: packDef.name,
        description: packDef.description,
        coinCost: packDef.coinCost,
        cardCount: packDef.cardCount,
        isActive: true,
        slots: {
          create: cards.map(card => ({
            cardId: card.id,
            weight: packDef.weights[card.rarity as keyof typeof packDef.weights] ?? 10,
          })),
        },
      },
    })

    console.log(`✓  Created "${pack.name}" — ${cards.length} card slots, ${packDef.coinCost} coins, ${packDef.cardCount} cards/open`)
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
