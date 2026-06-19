import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET() {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: { _count: { select: { slots: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(packs)
}
