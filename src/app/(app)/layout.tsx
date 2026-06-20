import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/layout/Navbar'
import { DailyBonusBanner } from '@/components/layout/DailyBonusBanner'
import { PullToRefresh } from '@/components/layout/PullToRefresh'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { coinBalance: true, loginStreak: true },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isAdmin={user.role === 'ADMIN'} coinBalance={dbUser?.coinBalance ?? 0} loginStreak={dbUser?.loginStreak ?? 0} />
      <PullToRefresh />
      <DailyBonusBanner />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
