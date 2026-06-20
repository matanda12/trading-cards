import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { ChevronLeft } from 'lucide-react'
import { GrantCardButton, CollectionTable } from './UserCardActions'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  await requireAdmin()
  const { userId } = await params

  const [user, entries, allCards] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        coinBalance: true,
        loginStreak: true,
        createdAt: true,
        isBanned: true,
      },
    }),
    prisma.collectionEntry.findMany({
      where: { userId },
      include: { card: { select: { id: true, name: true, rarity: true } } },
      orderBy: { obtainedAt: 'desc' },
    }),
    prisma.card.findMany({
      where: { isActive: true },
      select: { id: true, name: true, rarity: true },
      orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
    }),
  ])

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">User Detail</h1>
      </div>

      {/* User header */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="font-semibold">{user.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.username && <p className="text-xs text-primary">@{user.username}</p>}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Role</p>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-muted text-muted-foreground'}`}>
            {user.role}
          </span>
          {user.isBanned && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400">Banned</span>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Coins</p>
          <p className="font-bold text-amber-400">{user.coinBalance.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Streak / Cards</p>
          <p className="font-semibold">🔥 {user.loginStreak} days &nbsp;·&nbsp; {entries.length} cards</p>
        </div>
      </div>

      {/* Grant card */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Grant Card</h2>
        <GrantCardButton userId={userId} allCards={allCards} />
      </div>

      {/* Collection */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Collection ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No cards in collection.</p>
        ) : (
          <CollectionTable userId={userId} entries={entries} />
        )}
      </div>
    </div>
  )
}
