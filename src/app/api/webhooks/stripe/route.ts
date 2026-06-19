import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: import('stripe').Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session
    const type = session.metadata?.type

    if (type === 'coin_purchase') {
      const userId = session.metadata?.userId
      const coinAmount = Number(session.metadata?.coinAmount ?? '0')
      if (userId && coinAmount > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { coinBalance: { increment: coinAmount } },
        })
      }
    } else {
      const listingId = session.metadata?.listingId
      const buyerId = session.metadata?.buyerId

      if (listingId && buyerId) {
        let sellerId: string | null = null
        let cardName: string | null = null

        await prisma.$transaction(async (tx) => {
          const listing = await tx.listing.findUnique({
            where: { id: listingId },
            include: { card: true },
          })
          if (!listing || listing.status === 'SOLD') return

          sellerId = listing.sellerId
          cardName = listing.card.name

          await tx.listing.update({
            where: { id: listingId },
            data: { status: 'SOLD', buyerId, soldAt: new Date() },
          })

          await tx.collectionEntry.update({
            where: { id: listing.collectionEntryId },
            data: { userId: buyerId, source: 'PURCHASE' },
          })
        })

        if (sellerId && cardName) {
          await prisma.notification.create({
            data: {
              userId: sellerId,
              type: 'LISTING_SOLD',
              message: `Your listing for "${cardName}" was sold!`,
            },
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
