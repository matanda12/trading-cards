import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  await requireAdmin()
  const { tradeId } = await params

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } })
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only PENDING trades can be cancelled' }, { status: 400 })
  }

  await prisma.trade.update({ where: { id: tradeId }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ success: true })
}
