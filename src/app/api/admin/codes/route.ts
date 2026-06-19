import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { generateCodes } from '@/lib/codes'

const schema = z.object({
  cardId: z.string().min(1),
  count: z.number().int().min(1).max(10000),
  expiresAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  await requireAdmin()

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { cardId, count, expiresAt } = parsed.data

  const card = await prisma.card.findUnique({ where: { id: cardId } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const codes = generateCodes(count)

  // Check for any collisions with existing codes
  const existing = await prisma.redemptionCode.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  })
  const existingSet = new Set(existing.map((e) => e.code))
  const uniqueCodes = codes.filter((c) => !existingSet.has(c))

  // If we lost some to collision, top up
  while (uniqueCodes.length < count) {
    const extra = generateCodes(count - uniqueCodes.length)
    const extraFiltered = extra.filter((c) => !existingSet.has(c) && !uniqueCodes.includes(c))
    uniqueCodes.push(...extraFiltered)
  }
  uniqueCodes.splice(count)

  // Insert in chunks of 500
  const chunkSize = 500
  for (let i = 0; i < uniqueCodes.length; i += chunkSize) {
    const chunk = uniqueCodes.slice(i, i + chunkSize)
    await prisma.redemptionCode.createMany({
      data: chunk.map((code) => ({
        code,
        cardId,
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ codes: uniqueCodes })
}
