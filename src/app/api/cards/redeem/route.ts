import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const schema = z.object({ code: z.string().min(1) })

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  const code = parsed.data.code.toUpperCase().trim()
  const now = new Date()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const redemptionCode = await tx.redemptionCode.findUnique({ where: { code } })

      if (!redemptionCode) throw new Error('CODE_NOT_FOUND')
      if (redemptionCode.isRedeemed) throw new Error('ALREADY_REDEEMED')
      if (redemptionCode.expiresAt && redemptionCode.expiresAt < now) throw new Error('EXPIRED')

      await tx.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: { isRedeemed: true, redeemedBy: user.id, redeemedAt: now },
      })

      const entry = await tx.collectionEntry.create({
        data: { userId: user.id, cardId: redemptionCode.cardId, source: 'REDEEM' },
        include: { card: true },
      })

      return entry
    })

    return NextResponse.json({ success: true, card: result.card })
  } catch (err) {
    const msg = (err as Error).message
    if (msg === 'CODE_NOT_FOUND' || msg === 'ALREADY_REDEEMED') {
      return NextResponse.json({ error: 'Invalid or already redeemed code' }, { status: 404 })
    }
    if (msg === 'EXPIRED') {
      return NextResponse.json({ error: 'This code has expired' }, { status: 410 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
