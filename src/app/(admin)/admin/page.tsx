import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts'

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildSeries(dates: Date[], since: Date) {
  const counts: Record<string, number> = {}
  for (const d of dates) {
    if (d >= since) { const k = dateKey(d); counts[k] = (counts[k] ?? 0) + 1 }
  }
  const result = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const k = dateKey(d); result.push({ date: k, count: counts[k] ?? 0 })
  }
  return result
}

function buildRevenueSeries(records: { soldAt: Date | null; priceCents: number }[], since: Date) {
  const sums: Record<string, number> = {}
  for (const r of records) {
    if (r.soldAt && r.soldAt >= since) { const k = dateKey(r.soldAt); sums[k] = (sums[k] ?? 0) + r.priceCents }
  }
  const result = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const k = dateKey(d); result.push({ date: k, cents: sums[k] ?? 0 })
  }
  return result
}

export default async function AdminDashboard() {
  await requireAdmin()

  const since = new Date()
  since.setDate(since.getDate() - 14)

  const [
    totalUsers, totalCards, codesRedeemed, activeListing, soldListings,
    recentUsers, recentSales, recentPacks, recentCodes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.collectionEntry.count(),
    prisma.redemptionCode.count({ where: { isRedeemed: true } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({ where: { status: 'SOLD' }, _sum: { priceCents: true }, _count: true }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.listing.findMany({ where: { status: 'SOLD', soldAt: { gte: since } }, select: { soldAt: true, priceCents: true } }),
    prisma.packOpen.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.redemptionCode.findMany({
      where: { isRedeemed: true, redeemedAt: { gte: since } },
      orderBy: { redeemedAt: 'desc' }, take: 10,
      select: { redeemedAt: true, code: true },
    }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Cards Collected', value: totalCards },
    { label: 'Codes Redeemed', value: codesRedeemed },
    { label: 'Active Listings', value: activeListing },
    { label: 'Total Sales', value: soldListings._count },
    { label: 'Total Revenue', value: `$${((soldListings._sum.priceCents ?? 0) / 100).toFixed(2)}` },
  ]

  const usersPerDay = buildSeries(recentUsers.map((u) => u.createdAt), since)
  const packsPerDay = buildSeries(recentPacks.map((p) => p.createdAt), since)
  const revenuePerDay = buildRevenueSeries(recentSales, since)

  const activity = recentCodes.map((r) => ({
    icon: '🔑',
    message: `Code ${r.code.slice(0, 9)}… redeemed`,
    time: r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : '',
  }))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Admin</p>
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card/40 p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
            <p className="text-2xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last 14 Days</p>
        <AnalyticsCharts usersPerDay={usersPerDay} packsPerDay={packsPerDay} revenuePerDay={revenuePerDay} />
      </div>

      {activity.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Activity</p>
          <div className="rounded-xl border border-border/50 bg-card/40 divide-y divide-border/30">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span>{item.icon}</span>
                <span className="flex-1">{item.message}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/cards', label: '🃏 Cards' },
          { href: '/admin/packs', label: '📦 Packs' },
          { href: '/admin/users', label: '👥 Users' },
          { href: '/admin/codes', label: '🔑 Codes' },
          { href: '/admin/listings', label: '🏪 Listings' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border/50 bg-card/40 p-3 text-sm font-semibold text-center hover:bg-accent/30 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
