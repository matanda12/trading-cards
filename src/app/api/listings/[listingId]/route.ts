import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId } = await ctx.params
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      card: true,
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(listing)
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId } = await ctx.params
  const listing = await prisma.listing.findUnique({ where: { id: listingId } })

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.sellerId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Listing is not active' }, { status: 409 })
  }

  await prisma.listing.update({ where: { id: listingId }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ success: true })
}
