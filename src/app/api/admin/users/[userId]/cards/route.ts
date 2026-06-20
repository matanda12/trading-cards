import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ cardId: z.string().min(1) })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  await requireAdmin()
  const { userId } = await params
  const body = schema.parse(await req.json())

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const card = await prisma.card.findUnique({ where: { id: body.cardId } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const entry = await prisma.collectionEntry.create({
    data: { userId, cardId: body.cardId, source: 'ADMIN_GRANT' },
    include: { card: true },
  })

  return NextResponse.json(entry, { status: 201 })
}
