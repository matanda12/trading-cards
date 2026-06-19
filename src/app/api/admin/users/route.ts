import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 50

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      coinBalance: true,
      createdAt: true,
      _count: { select: { collectionEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json(users)
}
