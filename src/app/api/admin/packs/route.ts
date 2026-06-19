import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  coinCost: z.number().int().min(0),
  cardCount: z.number().int().min(1).max(20),
  slots: z.array(z.object({ cardId: z.string(), weight: z.number().int().min(1) })).min(1),
})

export async function GET() {
  await requireAdmin()

  const packs = await prisma.pack.findMany({
    include: { slots: { include: { card: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(packs)
}

export async function POST(request: NextRequest) {
  await requireAdmin()

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { slots, ...packData } = parsed.data

  const pack = await prisma.pack.create({
    data: {
      ...packData,
      slots: { create: slots },
    },
    include: { slots: { include: { card: true } } },
  })

  return NextResponse.json(pack, { status: 201 })
}
