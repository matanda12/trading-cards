/**
 * Generates a card back image for the pack opening animation.
 * Uploads to Cloudinary as 'trading-cards/card-back'.
 *
 * Usage:
 *   npx tsx prisma/generate-card-back.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import OpenAI from 'openai'
import { v2 as cloudinary } from 'cloudinary'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const PROMPT = `
Fantasy trading card back design for a game called "Realms of Eternity".
Portrait orientation. Deep dark background (#080810).
Central motif: an ornate mystical emblem — a radiant eye or sigil surrounded by an intricate circular mandala with arcane runes, golden filigree, and glowing purple energy.
Decorative border: elaborate dark gold ornamental frame with corner flourishes and subtle mystical engravings.
Color palette: deep black and dark navy background, rich gold and amber filigree, glowing purple and violet magical energy.
Style: ultra-detailed, painterly, premium collectible card aesthetic. No text. No card name. No stats. Symmetrical design.
`.trim()

async function main() {
  console.log('Generating card back image…')

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: PROMPT,
    n: 1,
    size: '1024x1536',
    quality: 'high',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('No image data returned from OpenAI')

  console.log('Uploading to Cloudinary…')
  const upload = await cloudinary.uploader.upload(`data:image/png;base64,${b64}`, {
    folder: 'trading-cards',
    public_id: 'card-back',
    overwrite: true,
    transformation: [{ width: 400, height: 560, crop: 'fill', gravity: 'center' }],
  })

  console.log(`✅ Done! Card back URL:\n${upload.secure_url}`)
  console.log(`\nAdd this to your .env.local:\nNEXT_PUBLIC_CARD_BACK_URL=${upload.secure_url}`)
}

main().catch(console.error)
