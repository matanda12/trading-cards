import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  await requireAdmin()

  const [totalUsers, totalCards, codesRedeemed, activeListing, soldListings] = await Promise.all([
    prisma.user.count(),
    prisma.collectionEntry.count(),
    prisma.redemptionCode.count({ where: { isRedeemed: true } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({ where: { status: 'SOLD' }, _sum: { priceCents: true }, _count: true }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Cards Collected', value: totalCards },
    { label: 'Codes Redeemed', value: codesRedeemed },
    { label: 'Active Listings', value: activeListing },
    { label: 'Total Sales', value: soldListings._count },
    { label: 'Total Revenue', value: `$${((soldListings._sum.priceCents ?? 0) / 100).toFixed(2)}` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border rounded-lg p-4 bg-card">
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
