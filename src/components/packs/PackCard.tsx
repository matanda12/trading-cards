'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const CARD_BACK = 'https://res.cloudinary.com/deqobi7dv/image/upload/v1781928998/trading-cards/card-back.png'

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
const PACK_GLOW: Record<string, string> = {
  'Starter Pack':   '0 0 30px rgba(96,165,250,0.35)',
  'Premium Pack':   '0 0 30px rgba(168,85,247,0.45)',
  'Legendary Hunt': '0 0 35px rgba(251,191,36,0.45)',
}
const PACK_BORDER_HOVER: Record<string, string> = {
  'Starter Pack':   'rgba(96,165,250,0.5)',
  'Premium Pack':   'rgba(168,85,247,0.5)',
  'Legendary Hunt': 'rgba(251,191,36,0.5)',
}

type DropRate = { rarity: string; pct: number }
type Props = {
  pack: {
    id: string
    name: string
    description: string | null
    coinCost: number
    cardCount: number
  }
  badge: { label: string; color: string } | undefined
  tint: string
  dropRates: DropRate[]
  canAfford: boolean
  legendaryRate: DropRate | undefined
  epicRate: DropRate | undefined
}

export function PackCard({ pack, badge, tint, dropRates, canAfford, legendaryRate, epicRate }: Props) {
  const [tiltStyle, setTiltStyle] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTiltStyle({ x: (y - 0.5) * -8, y: (x - 0.5) * 8 })
  }

  function handleMouseEnter() { setHovered(true) }
  function handleMouseLeave() { setTiltStyle({ x: 0, y: 0 }); setHovered(false) }

  const isIdle = tiltStyle.x === 0 && tiltStyle.y === 0

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(900px) rotateX(${tiltStyle.x}deg) rotateY(${tiltStyle.y}deg) scale(${hovered ? 1.02 : 1})`,
        transition: isIdle ? 'transform 0.4s ease, box-shadow 0.3s ease, border-color 0.3s ease' : 'transform 0.08s ease-out',
        boxShadow: hovered ? (PACK_GLOW[pack.name] ?? '0 0 30px rgba(168,85,247,0.35)') : 'none',
        borderColor: hovered ? (PACK_BORDER_HOVER[pack.name] ?? 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.1)',
      }}
      className={`relative rounded-2xl border bg-gradient-to-b ${tint} to-[#080810] overflow-hidden flex flex-col cursor-pointer`}
    >
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-widest uppercase ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      )}

      {/* Pack image with zoom on hover */}
      <div className="relative h-44 overflow-hidden">
        <Image
          src={CARD_BACK}
          alt={pack.name}
          fill
          className={`object-cover transition-transform duration-500 ${hovered ? 'scale-125' : 'scale-110'}`}
          sizes="400px"
        />
        {/* Shimmer sweep on hover */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
            transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
            transition: 'transform 0.6s ease',
          }}
        />
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

        {dropRates.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Drop Rates</p>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
              {dropRates.map(({ rarity, pct }) => (
                <div key={rarity} className={`${RARITY_COLORS[rarity]} transition-all duration-300`} style={{ width: `${pct}%` }} />
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
            onClick={(e) => e.stopPropagation()}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              canAfford
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'bg-white/5 text-slate-500 border border-white/5'
            }`}
          >
            {canAfford ? 'Open Pack' : 'Not enough coins'}
          </Link>
        </div>
      </div>
    </div>
  )
}
