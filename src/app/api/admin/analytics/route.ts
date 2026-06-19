import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  await requireAdmin()

  const [totalUsers, totalCards, codesRedeemed, activeListing, soldListings] = await Promise.all([
    prisma.user.count(),
    prisma.collectionEntry.count(),
    prisma.redemptionCode.count({ where: { isRedeemed: true } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({
      where: { status: 'SOLD' },
      _sum: { priceCents: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    totalUsers,
    totalCards,
    codesRedeemed,
    activeListing,
    totalSales: soldListings._count,
    revenueInCents: soldListings._sum.priceCents ?? 0,
  })
}
