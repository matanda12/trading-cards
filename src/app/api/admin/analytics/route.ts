import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildSeries(dates: Date[], since: Date): { date: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const d of dates) {
    if (d >= since) {
      const k = dateKey(d)
      counts[k] = (counts[k] ?? 0) + 1
    }
  }
  // Fill all 14 days
  const result = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const k = dateKey(d)
    result.push({ date: k, count: counts[k] ?? 0 })
  }
  return result
}

function buildRevenueSeries(records: { soldAt: Date | null; priceCents: number }[], since: Date) {
  const sums: Record<string, number> = {}
  for (const r of records) {
    if (r.soldAt && r.soldAt >= since) {
      const k = dateKey(r.soldAt)
      sums[k] = (sums[k] ?? 0) + r.priceCents
    }
  }
  const result = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const k = dateKey(d)
    result.push({ date: k, cents: sums[k] ?? 0 })
  }
  return result
}

export async function GET() {
  await requireAdmin()

  const since = new Date()
  since.setDate(since.getDate() - 14)

  const [
    totalUsers,
    totalCards,
    codesRedeemed,
    activeListing,
    soldListings,
    recentUsers,
    recentSales,
    recentPacks,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.collectionEntry.count(),
    prisma.redemptionCode.count({ where: { isRedeemed: true } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({
      where: { status: 'SOLD' },
      _sum: { priceCents: true },
      _count: true,
    }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.listing.findMany({
      where: { status: 'SOLD', soldAt: { gte: since } },
      select: { soldAt: true, priceCents: true },
    }),
    prisma.packOpen.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.redemptionCode.findMany({
      where: { isRedeemed: true, redeemedAt: { gte: since } },
      orderBy: { redeemedAt: 'desc' },
      take: 10,
      select: { redeemedAt: true, code: true },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    totalCards,
    codesRedeemed,
    activeListing,
    totalSales: soldListings._count,
    revenueInCents: soldListings._sum.priceCents ?? 0,
    usersPerDay: buildSeries(recentUsers.map((u) => u.createdAt), since),
    packsPerDay: buildSeries(recentPacks.map((p) => p.createdAt), since),
    revenuePerDay: buildRevenueSeries(recentSales, since),
    recentActivity: recentActivity.map((r) => ({
      type: 'REDEEM',
      message: `Code ${r.code.slice(0, 9)}… redeemed`,
      createdAt: r.redeemedAt,
    })),
  })
}
