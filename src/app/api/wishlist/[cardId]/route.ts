import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const user = await requireAuth()
  const { cardId } = await params
  await prisma.wishlist.upsert({
    where: { userId_cardId: { userId: user.id, cardId } },
    create: { userId: user.id, cardId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const user = await requireAuth()
  const { cardId } = await params
  await prisma.wishlist.deleteMany({ where: { userId: user.id, cardId } })
  return NextResponse.json({ ok: true })
}
