import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const RANK_MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default async function LeaderboardPage() {
  await requireAuth()

  const [topCollectors, topPackOpeners, topTraders] = await Promise.all([
    // Top collectors: most unique cards owned
    prisma.collectionEntry.groupBy({
      by: ['userId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 10,
    }).then(async (rows) => {
      const users = await prisma.user.findMany({
        where: { id: { in: rows.map((r) => r.userId) } },
        select: { id: true, username: true, name: true },
      })
      const byId = Object.fromEntries(users.map((u) => [u.id, u]))
      return rows.map((r) => ({ ...byId[r.userId], count: r._count.cardId }))
    }),

    // Top pack openers
    prisma.packOpen.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { openedAt: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }).then(async (rows) => {
      const users = await prisma.user.findMany({
        where: { id: { in: rows.map((r) => r.userId) } },
        select: { id: true, username: true, name: true },
      })
      const byId = Object.fromEntries(users.map((u) => [u.id, u]))
      return rows.map((r) => ({ ...byId[r.userId], count: r._count.id }))
    }),

    // Top traders: most completed trades
    prisma.trade.groupBy({
      by: ['initiatorId'],
      _count: { id: true },
      where: { status: 'ACCEPTED' },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }).then(async (rows) => {
      const users = await prisma.user.findMany({
        where: { id: { in: rows.map((r) => r.initiatorId) } },
        select: { id: true, username: true, name: true },
      })
      const byId = Object.fromEntries(users.map((u) => [u.id, u]))
      return rows.map((r) => ({ ...byId[r.initiatorId], count: r._count.id }))
    }),
  ])

  function displayName(u: { username: string | null; name: string | null } | undefined) {
    if (!u) return 'Unknown'
    return u.username ? `@${u.username}` : (u.name ?? 'Unknown')
  }

  function Board({ title, emoji, rows, unit }: { title: string; emoji: string; rows: Array<{ id?: string; username: string | null; name: string | null; count: number } | undefined>; unit: string }) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h2 className="font-cinzel font-bold text-sm tracking-wide text-white uppercase">{title}</h2>
        </div>
        <div className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="w-7 text-center text-sm font-bold text-slate-400">
                {RANK_MEDALS[i] ?? `#${i + 1}`}
              </span>
              {row?.id ? (
                <Link href={`/users/${row.id}`} className="flex-1 text-sm font-medium text-slate-200 hover:text-white hover:underline transition-colors">
                  {displayName(row)}
                </Link>
              ) : (
                <span className="flex-1 text-sm text-slate-400">{displayName(row)}</span>
              )}
              <span className="text-sm font-bold text-amber-400">{row?.count.toLocaleString()}</span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-500">No data yet</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Leaderboard</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">The greatest collectors in the realm.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Board title="Top Collectors" emoji="🃏" rows={topCollectors} unit="cards" />
        <Board title="Pack Openers" emoji="📦" rows={topPackOpeners} unit="packs" />
        <Board title="Top Traders" emoji="🤝" rows={topTraders} unit="trades" />
      </div>
    </div>
  )
}
