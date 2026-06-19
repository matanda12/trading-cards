import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { Rarity } from '@/generated/prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  rarity: z.nativeEnum(Rarity).optional(),
  category: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ cardId: string }> }
) {
  await requireAdmin()
  const { cardId } = await ctx.params
  const card = await prisma.card.findUnique({ where: { id: cardId } })
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(card)
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ cardId: string }> }
) {
  await requireAdmin()
  const { cardId } = await ctx.params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const card = await prisma.card.update({ where: { id: cardId }, data: parsed.data })
  return NextResponse.json(card)
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ cardId: string }> }
) {
  await requireAdmin()
  const { cardId } = await ctx.params

  await prisma.card.update({ where: { id: cardId }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
