'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import type { RoundResult } from '@/lib/battle'
import { RARITY_COLORS, RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'
import { FACTION_BEATS } from '@/lib/battle'

type CardInfo = {
  id: string
  name: string
  imageUrl: string
  rarity: string
  category: string
}

type BattleData = {
  id: string
  challengerId: string
  opponentId: string | null
  isAiOpponent: boolean
  winnerId: string | null
  rounds: RoundResult[]
  foughtAt: string
  challenger: { id: string; username: string | null; name: string | null }
  opponent: { id: string; username: string | null; name: string | null } | null
}

type Props = {
  battle: BattleData
  cardById: Record<string, CardInfo>
  currentUserId: string
}

const ROUND_DELAY = 1400

export function BattleReplay({ battle, cardById, currentUserId }: Props) {
  const [phase, setPhase] = useState<'IDLE' | 'PLAYING' | 'DONE'>('IDLE')
  const [revealedRound, setRevealedRound] = useState(0) // rounds revealed so far
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function schedule(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearAll(), [])

  function startReplay() {
    clearAll()
    setRevealedRound(0)
    setPhase('PLAYING')
    battle.rounds.forEach((_, i) => {
      schedule(() => setRevealedRound(i + 1), 400 + i * ROUND_DELAY)
    })
    schedule(() => {
      setPhase('DONE')
      if (battle.winnerId === currentUserId) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#fbbf24', '#a855f7', '#60a5fa'] })
      }
    }, 400 + 5 * ROUND_DELAY + 200)
  }

  const isChallenger = battle.challengerId === currentUserId
  const didWin = battle.winnerId === currentUserId
  const isTie = battle.winnerId === null

  const challengerWins = battle.rounds.filter((r) => r.winner === 'challenger').length
  const opponentWins = battle.rounds.filter((r) => r.winner === 'opponent').length

  const opponentLabel = battle.isAiOpponent
    ? 'AI Opponent'
    : battle.opponent?.username
    ? `@${battle.opponent.username}`
    : (battle.opponent?.name ?? 'Opponent')

  const myLabel = battle.challenger?.username
    ? `@${battle.challenger.username}`
    : (battle.challenger?.name ?? 'You')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/battle" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Battle
        </Link>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold font-cinzel">⚔️ Card Battle</h1>
        <p className="text-muted-foreground text-sm">
          {myLabel} vs {opponentLabel} · {new Date(battle.foughtAt).toLocaleDateString()}
        </p>
      </div>

      {/* Score tally */}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{isChallenger ? 'You' : myLabel}</p>
          <p className="text-4xl font-black text-primary">{challengerWins}</p>
        </div>
        <p className="text-2xl text-muted-foreground font-bold">–</p>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{opponentLabel}</p>
          <p className="text-4xl font-black text-rose-400">{opponentWins}</p>
        </div>
      </div>

      {/* Replay / Result */}
      {phase === 'IDLE' && (
        <div className="text-center">
          <button
            onClick={startReplay}
            className="px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-semibold text-sm hover:bg-primary/30 transition-colors"
          >
            ▶ Watch Replay
          </button>
        </div>
      )}

      {/* Rounds */}
      {(phase === 'PLAYING' || phase === 'DONE') && (
        <div className="space-y-4">
          {battle.rounds.map((round, i) => {
            const shown = revealedRound > i
            const cCard = cardById[round.challengerCardId]
            const oCard = cardById[round.opponentCardId]
            const cWon = round.winner === 'challenger'
            const oWon = round.winner === 'opponent'
            const isTieRound = round.winner === 'tie'

            return (
              <div
                key={round.round}
                className={`rounded-xl border p-4 transition-all duration-500 ${
                  shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${
                  cWon
                    ? 'border-primary/30 bg-primary/5'
                    : oWon
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-border/40 bg-card/20'
                }`}
              >
                <p className="text-xs text-muted-foreground font-semibold mb-3 text-center uppercase tracking-widest">
                  Round {round.round}
                </p>

                {shown && cCard && oCard ? (
                  <div className="flex items-center gap-3">
                    {/* Challenger card */}
                    <div className={`flex-1 rounded-xl border-2 p-2 transition-all ${cWon ? RARITY_COLORS[cCard.rarity as Rarity] : 'border-border/30'}`}>
                      <div className="relative aspect-[5/7] rounded-lg overflow-hidden mb-2">
                        <Image src={cCard.imageUrl} alt={cCard.name} fill className="object-cover" sizes="120px" />
                      </div>
                      <p className="text-xs font-semibold truncate">{cCard.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[cCard.rarity as Rarity]}`}>
                          {cCard.rarity}
                        </span>
                        <span className="text-xs text-muted-foreground">{cCard.category}</span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        <p>Base: <span className="text-foreground font-medium">+{round.challengerBase}</span></p>
                        {round.challengerFaction > 0 && (
                          <p className="text-green-400">Faction: +{round.challengerFaction} ✓</p>
                        )}
                        <p>Luck: +{round.challengerRandom}</p>
                      </div>
                      <p className={`text-lg font-black mt-2 ${cWon ? 'text-primary' : 'text-muted-foreground'}`}>
                        {round.challengerScore}
                        {cWon && ' 🏆'}
                      </p>
                    </div>

                    {/* VS divider */}
                    <div className="text-center shrink-0">
                      <p className="text-xl font-black text-muted-foreground">VS</p>
                      {isTieRound && <p className="text-xs text-muted-foreground mt-1">TIE</p>}
                    </div>

                    {/* Opponent card */}
                    <div className={`flex-1 rounded-xl border-2 p-2 transition-all ${oWon ? RARITY_COLORS[oCard.rarity as Rarity] : 'border-border/30'}`}>
                      <div className="relative aspect-[5/7] rounded-lg overflow-hidden mb-2">
                        <Image src={oCard.imageUrl} alt={oCard.name} fill className="object-cover" sizes="120px" />
                      </div>
                      <p className="text-xs font-semibold truncate">{oCard.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[oCard.rarity as Rarity]}`}>
                          {oCard.rarity}
                        </span>
                        <span className="text-xs text-muted-foreground">{oCard.category}</span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        <p>Base: <span className="text-foreground font-medium">+{round.opponentBase}</span></p>
                        {round.opponentFaction > 0 && (
                          <p className="text-green-400">Faction: +{round.opponentFaction} ✓</p>
                        )}
                        <p>Luck: +{round.opponentRandom}</p>
                      </div>
                      <p className={`text-lg font-black mt-2 ${oWon ? 'text-rose-400' : 'text-muted-foreground'}`}>
                        {round.opponentScore}
                        {oWon && ' 🏆'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Final result */}
      {phase === 'DONE' && (
        <div className={`rounded-2xl border p-6 text-center ${
          didWin
            ? 'border-yellow-400/40 bg-yellow-400/5'
            : isTie
            ? 'border-border/40 bg-card/20'
            : 'border-rose-500/30 bg-rose-500/5'
        }`}>
          <p className="text-3xl font-black font-cinzel mb-1">
            {didWin ? '🏆 Victory!' : isTie ? '🤝 Tie Game' : '💀 Defeat'}
          </p>
          {didWin && <p className="text-amber-400 font-semibold">+50 coins awarded</p>}
          <p className="text-muted-foreground text-sm mt-2">
            Final score: {challengerWins} – {opponentWins}
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link
              href="/battle"
              className="px-5 py-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/30 transition-colors"
            >
              Battle Again
            </Link>
          </div>
        </div>
      )}

      {/* Faction guide */}
      <div className="rounded-xl border border-border/30 bg-card/20 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Faction Advantage (+15)</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {Object.entries(FACTION_BEATS).map(([from, to]) => (
            <span key={from} className="px-2 py-0.5 rounded border border-border/30 bg-background/50">
              {from} → {to}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
