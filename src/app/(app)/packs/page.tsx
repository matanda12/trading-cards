import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

const CARD_BACK = 'https://res.cloudinary.com/deqobi7dv/image/upload/v1781928998/trading-cards/card-back.png'

const RARITY_ORDER: Record<string, number> = { LEGENDARY: 0, EPIC: 1, RARE: 2, UNCOMMON: 3, COMMON: 4 }
const RARITY_COLORS: Record<string, string> = {
  LEGENDARY: 'bg-amber-400',
  EPIC:      'bg-purple-500',
  RARE:      'bg-blue-500',
  UNCOMMON:  'bg-green-500',
  COMMON:    'bg-slate-500',
}
const RARITY_DOT: Record<string, string> = {
  LEGENDARY: 'bg-amber-400',
  EPIC:      'bg-purple-400',
  RARE:      'bg-blue-400',
  UNCOMMON:  'bg-green-400',
  COMMON:    'bg-slate-400',
}
const PACK_BADGES: Record<string, { label: string; color: string }> = {
  'Starter Pack':   { label: 'STANDARD',   color: 'bg-slate-600/80 text-slate-200' },
  'Premium Pack':   { label: 'POPULAR',    color: 'bg-purple-600/80 text-purple-100' },
  'Legendary Hunt': { label: 'BEST VALUE', color: 'bg-amber-600/80 text-amber-100' },
}
const PACK_TINTS: Record<string, string> = {
  'Starter Pack':   'from-blue-950/50',
  'Premium Pack':   'from-purple-950/50',
  'Legendary Hunt': 'from-amber-950/50',
}

function calcDropRates(slots: { weight: number; card: { rarity: string } }[]) {
  const totals: Record<string, number> = {}
  let sum = 0
  for (const slot of slots) {
    totals[slot.card.rarity] = (totals[slot.card.rarity] ?? 0) + slot.weight
    sum += slot.weight
  }
  if (sum === 0) return []
  return Object.entries(totals)
    .map(([rarity, weight]) => ({ rarity, pct: Math.round((weight / sum) * 100) }))
    .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 5) - (RARITY_ORDER[b.rarity] ?? 5))
}

export default async function PacksPage() {
  const user = await requireAuth()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { coinBalance: true } })

  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: { slots: { include: { card: { select: { rarity: true } } } } },
    orderBy: { coinCost: 'asc' },
  })

  const coinBalance = dbUser?.coinBalance ?? 0
  const featured = packs.reduce((max, p) => p.coinCost > max.coinCost ? p : max, packs[0])

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Store</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Open Packs</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
          Spend your gold to unseal booster packs and summon new champions into your collection.<br />
          Higher tiers carry richer odds and guaranteed pulls.
        </p>
      </div>

      {/* Featured Pack */}
      {featured && (
        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-[#0d0a18] to-purple-950/30 overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
          <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-36 h-48 shrink-0 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
              <Image src={CARD_BACK} alt={featured.name} fill className="object-cover" sizes="144px" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 to-transparent" />
            </div>
            <div className="space-y-3 flex-1">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-widest uppercase">
                ⭐ Featured
              </span>
              <h2 className="font-cinzel text-2xl md:text-3xl font-black text-white">{featured.name}</h2>
              {featured.description && (
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">{featured.description}</p>
              )}
              <p className="text-slate-500 text-xs">🃏 {featured.cardCount} cards per open</p>
              <div className="flex items-center gap-4 pt-1">
                <span className="text-amber-400 font-bold text-xl flex items-center gap-1.5">
                  🪙 {featured.coinCost.toLocaleString()}
                </span>
                <Link
                  href={`/packs/${featured.id}`}
                  className={`px-5 py-2 rounded-lg font-cinzel font-bold text-sm tracking-wide transition-all ${
                    coinBalance >= featured.coinCost
                      ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Open {featured.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Packs */}
      <div>
        <h2 className="font-cinzel text-base font-bold text-slate-400 mb-4 tracking-widest uppercase">All Packs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map((pack) => {
            const badge = PACK_BADGES[pack.name]
            const tint = PACK_TINTS[pack.name] ?? 'from-purple-950/50'
            const dropRates = calcDropRates(pack.slots)
            const canAfford = coinBalance >= pack.coinCost
            const legendaryRate = dropRates.find(r => r.rarity === 'LEGENDARY')
            const epicRate = dropRates.find(r => r.rarity === 'EPIC')

            return (
              <div key={pack.id} className={`relative rounded-2xl border border-white/10 bg-gradient-to-b ${tint} to-[#080810] overflow-hidden flex flex-col hover:border-white/20 hover:shadow-2xl transition-all duration-200`}>
                {badge && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-widest uppercase ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                )}

                {/* Pack image */}
                <div className="relative h-44 overflow-hidden">
                  <Image src={CARD_BACK} alt={pack.name} fill className="object-cover scale-110" sizes="400px" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080810]" />
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-cinzel font-bold text-base text-white">{pack.name}</h3>
                    {pack.description && (
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed line-clamp-2">{pack.description}</p>
                    )}
                  </div>

                  <div className="space-y-0.5 text-xs text-slate-400">
                    <div>🃏 {pack.cardCount} cards per pack</div>
                    {legendaryRate && <div>⭐ 1 Legendary guaranteed</div>}
                    {!legendaryRate && epicRate && <div>✨ 1 Epic or better</div>}
                  </div>

                  {/* Drop rates bar */}
                  {dropRates.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Drop Rates</p>
                      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                        {dropRates.map(({ rarity, pct }) => (
                          <div key={rarity} className={`${RARITY_COLORS[rarity]}`} style={{ width: `${pct}%` }} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {dropRates.filter(r => r.rarity !== 'COMMON' && r.rarity !== 'UNCOMMON').map(({ rarity, pct }) => (
                          <div key={rarity} className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[rarity]}`} />
                            {rarity.charAt(0) + rarity.slice(1).toLowerCase()} {pct}%
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <span className="text-amber-400 font-bold text-sm">🪙 {pack.coinCost.toLocaleString()}</span>
                    <Link
                      href={`/packs/${pack.id}`}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canAfford
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-white/5 text-slate-500 border border-white/5'
                      }`}
                    >
                      {canAfford ? 'Open Pack' : 'Not enough coins'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
