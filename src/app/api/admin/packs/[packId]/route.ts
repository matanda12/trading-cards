import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coinCost: z.number().int().min(0).optional(),
  cardCount: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  slots: z
    .array(z.object({ cardId: z.string(), weight: z.number().int().min(1) }))
    .optional(),
})

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ packId: string }> }
) {
  await requireAdmin()
  const { packId } = await ctx.params

  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    include: { slots: { include: { card: true } } },
  })
  if (!pack) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pack)
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ packId: string }> }
) {
  await requireAdmin()
  const { packId } = await ctx.params

  const body = await request.json()
  const result = patchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  const { slots, ...packData } = result.data

  const pack = await prisma.$transaction(async (tx) => {
    const updated = await tx.pack.update({ where: { id: packId }, data: packData })

    if (slots) {
      await tx.packSlot.deleteMany({ where: { packId } })
      await tx.packSlot.createMany({
        data: slots.map((s) => ({ packId, cardId: s.cardId, weight: s.weight })),
      })
    }

    return updated
  })

  return NextResponse.json(pack)
}
