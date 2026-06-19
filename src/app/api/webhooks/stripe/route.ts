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
    const listingId = session.metadata?.listingId
    const buyerId = session.metadata?.buyerId

    if (!listingId || !buyerId) return NextResponse.json({ ok: true })

    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: listingId } })
      if (!listing || listing.status === 'SOLD') return

      await tx.listing.update({
        where: { id: listingId },
        data: { status: 'SOLD', buyerId, soldAt: new Date() },
      })

      await tx.collectionEntry.update({
        where: { id: listing.collectionEntryId },
        data: { userId: buyerId, source: 'PURCHASE' },
      })
    })
  }

  return NextResponse.json({ ok: true })
}
