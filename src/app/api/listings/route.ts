import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const createSchema = z.object({
  collectionEntryId: z.string().min(1),
  priceCents: z.number().int().min(100),
})

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rarity = searchParams.get('rarity')
  const search = searchParams.get('q')
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 24

  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      card: {
        ...(rarity ? { rarity: rarity as never } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        isActive: true,
      },
    },
    include: {
      card: true,
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json(listings)
}

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { collectionEntryId, priceCents } = parsed.data

  const entry = await prisma.collectionEntry.findUnique({
    where: { id: collectionEntryId },
    include: { listing: true, tradeItem: true },
  })

  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: 'Card not found in your collection' }, { status: 404 })
  }
  if (entry.listing?.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Card is already listed' }, { status: 409 })
  }
  if (entry.tradeItem) {
    return NextResponse.json({ error: 'Card is in a pending trade' }, { status: 409 })
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      cardId: entry.cardId,
      collectionEntryId,
      priceCents,
    },
    include: { card: true },
  })

  return NextResponse.json(listing, { status: 201 })
}
