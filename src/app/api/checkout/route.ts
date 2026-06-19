import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/session'

const schema = z.object({ listingId: z.string().min(1) })

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { listingId } = parsed.data

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { card: true },
  })

  if (!listing || listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Listing not available' }, { status: 404 })
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.card.name,
            description: `${listing.card.rarity} card`,
            images: [listing.card.imageUrl],
          },
          unit_amount: listing.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { listingId, buyerId: user.id },
    success_url: `${appUrl}/marketplace/${listingId}?success=true`,
    cancel_url: `${appUrl}/marketplace/${listingId}`,
  })

  await prisma.listing.update({
    where: { id: listingId },
    data: { stripeSessionId: session.id },
  })

  return NextResponse.json({ url: session.url })
}
