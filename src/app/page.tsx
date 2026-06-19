import Link from 'next/link'
import { Button } from '@/components/ui/button'

const HERO_CARDS = [
  { emoji: '🌿', rarity: 'Common',    border: 'border-slate-400',  bg: 'from-slate-800 to-slate-700',     rotate: '-rotate-[8deg]',             glow: '' },
  { emoji: '⚡', rarity: 'Uncommon', border: 'border-green-400',  bg: 'from-green-950 to-green-800',     rotate: '-rotate-[4deg] -translate-y-2', glow: 'shadow-lg shadow-green-400/30' },
  { emoji: '🔮', rarity: 'Rare',     border: 'border-blue-500',   bg: 'from-blue-950 to-blue-800',       rotate: 'rotate-[2deg] -translate-y-4', glow: 'shadow-xl shadow-blue-500/40' },
  { emoji: '💎', rarity: 'Epic',     border: 'border-purple-500', bg: 'from-purple-950 to-purple-800',   rotate: 'rotate-[5deg] -translate-y-2', glow: 'shadow-xl shadow-purple-500/50' },
  { emoji: '🔥', rarity: 'Legendary',border: 'border-yellow-400', bg: 'from-yellow-950 to-amber-800',    rotate: 'rotate-[9deg]',               glow: 'shadow-2xl shadow-yellow-400/55' },
]

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
      <div className="space-y-5 max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-300">
          ✦ Trading Card Platform
        </div>
        <h1 className="text-5xl font-black tracking-tight leading-[1.05] bg-gradient-to-br from-white via-purple-200 to-purple-400 bg-clip-text text-transparent sm:text-6xl">
          Collect.<br />Trade. Dominate.
        </h1>
        <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
          Build the ultimate collection. Trade with rivals. Open packs and discover legendary cards.
        </p>
      </div>

      <div className="flex gap-3">
        <Button size="lg" render={<Link href="/register" />}>
          Get Started
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/login" />}>
          Sign In
        </Button>
      </div>

      <div className="flex items-end justify-center gap-3" style={{ perspective: '600px' }}>
        {HERO_CARDS.map((c) => (
          <div
            key={c.rarity}
            className={`relative w-20 aspect-[5/7] rounded-xl border-2 overflow-hidden shrink-0 ${c.border} ${c.glow} transform ${c.rotate}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} flex items-center justify-center text-3xl`}>
              {c.emoji}
            </div>
            <div className="absolute bottom-0 left-0 right-0 py-1 bg-black/60 text-[8px] font-bold uppercase tracking-wider text-center text-white/80">
              {c.rarity}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
