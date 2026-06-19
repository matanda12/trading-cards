import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/session'

const VALID_BUNDLES: Record<number, number> = {
  500: 499,
  1500: 1299,
  5000: 3999,
}

const schema = z.object({
  coins: z.number().int().positive(),
  priceCents: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { coins, priceCents } = parsed.data

  // Validate bundle — prevent price manipulation
  if (VALID_BUNDLES[coins] !== priceCents) {
    return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${coins.toLocaleString()} CardVault Coins`,
            description: `Add ${coins.toLocaleString()} coins to your account`,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { type: 'coin_purchase', userId: user.id, coinAmount: String(coins) },
    success_url: `${appUrl}/coins?success=true`,
    cancel_url: `${appUrl}/coins`,
  })

  return NextResponse.json({ url: session.url })
}
