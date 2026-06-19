import { PrismaClient, Rarity } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'matan.dayan.12@gmail.com'

  // Upsert admin user
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await bcrypt.hash('changeme123!', 12),
      role: 'ADMIN',
      coinBalance: 1000,
    },
  })

  console.log(`✓ Admin user: ${adminEmail}`)

  // Seed sample cards
  const cards = [
    { name: 'Shadow Dragon', rarity: Rarity.LEGENDARY, category: 'Fantasy', imageUrl: 'https://placehold.co/400x560/1a1a2e/gold?text=Shadow+Dragon', description: 'An ancient dragon born from shadow and flame.' },
    { name: 'Crystal Phoenix', rarity: Rarity.EPIC, category: 'Fantasy', imageUrl: 'https://placehold.co/400x560/0f0c29/a855f7?text=Crystal+Phoenix', description: 'A phoenix whose feathers are made of pure crystal.' },
    { name: 'Iron Golem', rarity: Rarity.RARE, category: 'Fantasy', imageUrl: 'https://placehold.co/400x560/141e30/3b82f6?text=Iron+Golem', description: 'A massive construct forged in the deepest mines.' },
    { name: 'Forest Sprite', rarity: Rarity.UNCOMMON, category: 'Fantasy', imageUrl: 'https://placehold.co/400x560/0a4a1e/22c55e?text=Forest+Sprite', description: 'A mischievous spirit of the ancient forest.' },
    { name: 'Stone Troll', rarity: Rarity.COMMON, category: 'Fantasy', imageUrl: 'https://placehold.co/400x560/2d2d2d/94a3b8?text=Stone+Troll', description: 'A slow but incredibly durable creature.' },
  ]

  for (const cardData of cards) {
    const card = await prisma.card.upsert({
      where: { id: `seed-${cardData.name.replace(/\s/g, '-').toLowerCase()}` },
      update: {},
      create: { id: `seed-${cardData.name.replace(/\s/g, '-').toLowerCase()}`, ...cardData },
    })

    // Generate 5 codes per card
    const { generateCodes } = await import('../src/lib/codes')
    const codes = generateCodes(5)
    await prisma.redemptionCode.createMany({
      data: codes.map((code) => ({ code, cardId: card.id })),
      skipDuplicates: true,
    })

    console.log(`✓ Card: ${card.name} (${card.rarity}) — ${codes.length} codes generated`)
    console.log(`  Codes: ${codes.join(', ')}`)
  }

  // Seed a starter pack
  const allCards = await prisma.card.findMany()
  if (allCards.length > 0) {
    await prisma.pack.upsert({
      where: { id: 'seed-starter-pack' },
      update: {},
      create: {
        id: 'seed-starter-pack',
        name: 'Starter Pack',
        description: 'Open to receive 3 random cards from the collection.',
        coinCost: 100,
        cardCount: 3,
        slots: {
          create: allCards.map((card) => ({
            cardId: card.id,
            weight: { COMMON: 60, UNCOMMON: 25, RARE: 10, EPIC: 4, LEGENDARY: 1 }[card.rarity] ?? 10,
          })),
        },
      },
    })
    console.log('✓ Starter Pack seeded')
  }

  console.log('\nSeed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
