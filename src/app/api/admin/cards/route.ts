import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { Rarity } from '@/generated/prisma/client'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  rarity: z.nativeEnum(Rarity),
  category: z.string().min(1).max(50),
})

export async function GET() {
  await requireAdmin()

  const cards = await prisma.card.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptionCodes: true, collectionEntries: true } } },
  })

  return NextResponse.json(cards)
}

export async function POST(request: NextRequest) {
  await requireAdmin()

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const card = await prisma.card.create({ data: parsed.data })
  return NextResponse.json(card, { status: 201 })
}
