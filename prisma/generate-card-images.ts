/**
 * Generates AI images for all cards using OpenAI DALL-E 3,
 * uploads them to Cloudinary, and updates the database.
 *
 * Requirements:
 *   OPENAI_API_KEY=sk-... in .env.local
 *   (Cloudinary vars already set)
 *
 * Usage:
 *   npx tsx prisma/generate-card-images.ts
 *
 * Cost estimate: ~$0.04 per image × 150 cards = ~$6
 * Runtime: ~8 minutes (3s/image + 1s delay)
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import OpenAI from 'openai'
import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ── clients ──────────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

// ── helpers ───────────────────────────────────────────────────────────────────

const FACTION_STYLE: Record<string, string> = {
  Arcane:  'mystical purple and cosmic energy, arcane runes, starfields, ethereal magic',
  Light:   'radiant golden light, holy aura, warm sunbeams, divine atmosphere',
  Iron:    'dark metal and forge fires, industrial fantasy, steel and steam',
  Shadow:  'deep darkness, moonlight, black mist, shadowy and mysterious',
  Water:   'ocean blues and teals, flowing water, underwater light, aquatic',
  Fire:    'blazing orange and red flames, volcanic, intense heat and embers',
  Nature:  'lush green forest, ancient trees, vines and roots, earthy tones',
}

function buildPrompt(name: string, description: string, faction: string, rarity: string): string {
  const factionStyle = FACTION_STYLE[faction] ?? 'epic fantasy'
  const rarityEmphasis =
    rarity === 'LEGENDARY' ? 'Awe-inspiring, god-like power, ultimate fantasy artwork.' :
    rarity === 'EPIC'      ? 'Powerful and dramatic, highly detailed epic fantasy.' :
    rarity === 'RARE'      ? 'Striking and detailed fantasy illustration.' :
    rarity === 'UNCOMMON'  ? 'Competent fantasy warrior or creature art.' :
                             'Simple but charming fantasy character art.'

  return (
    `Fantasy trading card game illustration: "${name}". ` +
    `${description} ` +
    `Visual style: ${factionStyle}. ` +
    `${rarityEmphasis} ` +
    `Portrait orientation, painterly style, cinematic lighting, dark fantasy aesthetic. ` +
    `No text, no card borders, no UI elements. Full bleed illustration only.`
  )
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌  OPENAI_API_KEY not found in .env.local')
    process.exit(1)
  }

  // Fetch all cards that still have placeholder images
  const cards = await prisma.card.findMany({
    where: { imageUrl: { contains: 'placehold.co' } },
    orderBy: { rarity: 'asc' },
  })

  if (cards.length === 0) {
    console.log('✅  All cards already have real images.')
    return
  }

  console.log(`Generating images for ${cards.length} cards…`)
  console.log(`Estimated cost: $${(cards.length * 0.04).toFixed(2)}`)
  console.log(`Estimated time: ~${Math.ceil(cards.length * 4 / 60)} minutes\n`)

  let done = 0
  let failed = 0

  for (const card of cards) {
    try {
      process.stdout.write(`[${done + 1}/${cards.length}] ${card.name} (${card.rarity})… `)

      // 1. Generate with DALL-E 3
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: buildPrompt(card.name, card.description ?? '', card.category ?? 'Arcane', card.rarity),
        n: 1,
        size: '1024x1536',
        quality: 'medium',
      })

      const b64 = response.data[0]?.b64_json
      if (!b64) throw new Error('No image data returned from OpenAI')

      // 2. Upload to Cloudinary as base64 data URL
      const upload = await cloudinary.uploader.upload(`data:image/png;base64,${b64}`, {
        folder: 'trading-cards',
        public_id: card.id,
        overwrite: true,
        transformation: [{ width: 400, height: 560, crop: 'fill', gravity: 'center' }],
      })

      // 3. Update database
      await prisma.card.update({
        where: { id: card.id },
        data: { imageUrl: upload.secure_url },
      })

      done++
      console.log(`✓ saved`)

      // Respect rate limits (~5 req/min on free tier, ~50 req/min on paid)
      await sleep(1200)
    } catch (err: unknown) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`✗ FAILED: ${msg}`)
      await sleep(2000)
    }
  }

  console.log(`\n✅  Done — ${done} generated, ${failed} failed.`)
  if (failed > 0) {
    console.log(`Run the script again to retry failed cards.`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
