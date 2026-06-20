import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function displayName(user: { username: string | null; name: string | null }) {
  return user.username ? `@${user.username}` : (user.name ?? 'Someone')
}

export default async function FeedPage() {
  await requireAuth()

  const [packOpens, completedTrades, recentRedeems, recentBattles] = await Promise.all([
    prisma.packOpen.findMany({
      where: { openedAt: { not: null } },
      include: {
        user: { select: { id: true, username: true, name: true } },
        pack: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),

    prisma.trade.findMany({
      where: { status: 'ACCEPTED' },
      include: {
        initiator: { select: { id: true, username: true, name: true } },
        receiver: { select: { id: true, username: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),

    prisma.collectionEntry.findMany({
      where: { source: 'REDEEM' },
      include: {
        user: { select: { id: true, username: true, name: true } },
        card: { select: { name: true, rarity: true } },
      },
      orderBy: { obtainedAt: 'desc' },
      take: 20,
    }),

    prisma.battle.findMany({
      where: { isAiOpponent: false },
      include: {
        challenger: { select: { id: true, username: true, name: true } },
        opponent: { select: { id: true, username: true, name: true } },
      },
      orderBy: { foughtAt: 'desc' },
      take: 20,
    }),
  ])

  type FeedEvent = { time: Date; emoji: string; message: string }
  const events: FeedEvent[] = []

  for (const open of packOpens) {
    events.push({
      time: open.createdAt,
      emoji: '📦',
      message: `${displayName(open.user)} opened a ${open.pack.name}.`,
    })
  }

  for (const trade of completedTrades) {
    events.push({
      time: trade.updatedAt,
      emoji: '🤝',
      message: `${displayName(trade.initiator)} and ${displayName(trade.receiver)} completed a trade.`,
    })
  }

  for (const entry of recentRedeems) {
    const isLegendary = entry.card.rarity === 'LEGENDARY'
    const isEpic = entry.card.rarity === 'EPIC'
    events.push({
      time: entry.obtainedAt,
      emoji: isLegendary ? '✨' : isEpic ? '⚡' : '🎟️',
      message: isLegendary
        ? `${displayName(entry.user)} redeemed a LEGENDARY "${entry.card.name}"!`
        : `${displayName(entry.user)} redeemed "${entry.card.name}".`,
    })
  }

  for (const battle of recentBattles) {
    if (!battle.opponent) continue
    const winner = battle.winnerId
      ? battle.winnerId === battle.challengerId
        ? displayName(battle.challenger)
        : displayName(battle.opponent)
      : null
    events.push({
      time: battle.foughtAt,
      emoji: '⚔️',
      message: winner
        ? `${winner} defeated ${battle.winnerId === battle.challengerId ? displayName(battle.opponent) : displayName(battle.challenger)} in a card battle!`
        : `${displayName(battle.challenger)} and ${displayName(battle.opponent)} tied in a card battle.`,
    })
  }

  events.sort((a, b) => b.time.getTime() - a.time.getTime())
  const feed = events.slice(0, 50)

  return (
    <div className="space-y-6">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Community</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Activity Feed</h1>
        <p className="text-slate-400 text-sm mt-1">What&apos;s happening across the realm.</p>
      </div>

      {feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="text-5xl">🌐</div>
          <div>
            <h2 className="text-xl font-bold">Nothing yet</h2>
            <p className="text-muted-foreground text-sm mt-1">Be the first to open a pack or complete a trade.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map((event, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <span className="text-xl shrink-0 mt-0.5">{event.emoji}</span>
              <p className="text-sm text-slate-300 flex-1 leading-relaxed">{event.message}</p>
              <span className="text-xs text-slate-500 shrink-0 mt-0.5">{timeAgo(event.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
