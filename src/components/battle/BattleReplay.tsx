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

const ROUND_DELAY = 1600

const ROUND_TYPE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  power: { label: '⚡ Power Round', color: 'text-yellow-400', desc: 'No luck — pure skill' },
  final: { label: '🔥 Final Clash', color: 'text-red-400', desc: 'Luck doubled (0–30)' },
  normal: { label: '', color: '', desc: '' },
}

export function BattleReplay({ battle, cardById, currentUserId }: Props) {
  const [phase, setPhase] = useState<'IDLE' | 'PLAYING' | 'DONE'>('IDLE')
  const [revealedRound, setRevealedRound] = useState(0)
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
        const isCleanSweep = battle.rounds.every((r) => r.winner === 'challenger' || r.winner === 'opponent')
          && battle.rounds.filter((r) => r.winner !== 'tie').every((r) =>
            battle.winnerId === battle.challengerId ? r.winner === 'challenger' : r.winner === 'opponent'
          )
        confetti({
          particleCount: isCleanSweep ? 200 : 120,
          spread: isCleanSweep ? 100 : 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#a855f7', '#60a5fa', '#34d399'],
        })
      }
    }, 400 + 5 * ROUND_DELAY + 200)
  }

  const isChallenger = battle.challengerId === currentUserId
  const didWin = battle.winnerId === currentUserId
  const isTie = battle.winnerId === null

  const challengerWins = battle.rounds.filter((r) => r.winner === 'challenger').length
  const opponentWins = battle.rounds.filter((r) => r.winner === 'opponent').length
  const isCleanSweep = challengerWins === 5 || opponentWins === 5
  const coinReward = isCleanSweep ? 100 : 50

  const opponentLabel = battle.isAiOpponent
    ? '🤖 AI Opponent'
    : battle.opponent?.username ? `@${battle.opponent.username}` : (battle.opponent?.name ?? 'Opponent')

  const myLabel = battle.challenger?.username ? `@${battle.challenger.username}` : (battle.challenger?.name ?? 'You')

  // Compute faction synergy per side for display
  const challengerFactions = battle.rounds.map((r) => cardById[r.challengerCardId]?.category).filter(Boolean)
  const opponentFactions = battle.rounds.map((r) => cardById[r.opponentCardId]?.category).filter(Boolean)
  const countFactions = (factions: string[]) => {
    const counts: Record<string, number> = {}
    for (const f of factions) counts[f] = (counts[f] ?? 0) + 1
    return counts
  }
  const cFactionCounts = countFactions(challengerFactions)
  const oFactionCounts = countFactions(opponentFactions)
  const cSynergyFactions = Object.entries(cFactionCounts).filter(([, n]) => n >= 3).map(([f]) => f)
  const oSynergyFactions = Object.entries(oFactionCounts).filter(([, n]) => n >= 3).map(([f]) => f)

  return (
    <div className="space-y-6">
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

      {/* Synergy badges */}
      {(cSynergyFactions.length > 0 || oSynergyFactions.length > 0) && (
        <div className="flex gap-3 justify-center flex-wrap">
          {cSynergyFactions.map((f) => (
            <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold">
              ✦ {f} Synergy (+10)
            </span>
          ))}
          {oSynergyFactions.map((f) => (
            <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
              ✦ {f} Synergy (+10)
            </span>
          ))}
        </div>
      )}

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
            const roundMeta = ROUND_TYPE_LABELS[round.roundType] ?? ROUND_TYPE_LABELS.normal

            return (
              <div
                key={round.round}
                className={`rounded-xl border p-4 transition-all duration-500 ${
                  shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${
                  round.roundType === 'power' ? 'border-yellow-400/20 bg-yellow-400/5' :
                  round.roundType === 'final' ? 'border-red-400/20 bg-red-400/5' :
                  cWon ? 'border-primary/30 bg-primary/5' :
                  oWon ? 'border-rose-500/30 bg-rose-500/5' :
                  'border-border/40 bg-card/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                    Round {round.round}
                  </p>
                  {roundMeta.label && (
                    <div className="text-right">
                      <p className={`text-xs font-bold ${roundMeta.color}`}>{roundMeta.label}</p>
                      <p className="text-xs text-muted-foreground">{roundMeta.desc}</p>
                    </div>
                  )}
                </div>

                {shown && cCard && oCard ? (
                  <div className="flex items-start gap-3">
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
                        <p>Base <span className="text-foreground font-medium">+{round.challengerBase}</span></p>
                        {round.challengerFaction > 0 && <p className="text-emerald-400">Faction +{round.challengerFaction} ✓</p>}
                        {round.challengerSynergy > 0 && <p className="text-purple-400">Synergy +{round.challengerSynergy} ✦</p>}
                        {round.challengerRandom > 0 && <p>Luck +{round.challengerRandom}</p>}
                        {round.roundType === 'power' && <p className="text-yellow-400">⚡ No luck</p>}
                      </div>
                      <p className={`text-lg font-black mt-2 ${cWon ? 'text-primary' : 'text-muted-foreground'}`}>
                        {round.challengerScore}{cWon && ' 🏆'}
                      </p>
                    </div>

                    <div className="text-center shrink-0 pt-8">
                      <p className="text-xl font-black text-muted-foreground">VS</p>
                      {round.winner === 'tie' && <p className="text-xs text-muted-foreground mt-1">TIE</p>}
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
                        <p>Base <span className="text-foreground font-medium">+{round.opponentBase}</span></p>
                        {round.opponentFaction > 0 && <p className="text-emerald-400">Faction +{round.opponentFaction} ✓</p>}
                        {round.opponentSynergy > 0 && <p className="text-purple-400">Synergy +{round.opponentSynergy} ✦</p>}
                        {round.opponentRandom > 0 && <p>Luck +{round.opponentRandom}</p>}
                        {round.roundType === 'power' && <p className="text-yellow-400">⚡ No luck</p>}
                      </div>
                      <p className={`text-lg font-black mt-2 ${oWon ? 'text-rose-400' : 'text-muted-foreground'}`}>
                        {round.opponentScore}{oWon && ' 🏆'}
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
        <div className={`rounded-2xl border p-6 text-center space-y-2 ${
          didWin ? 'border-yellow-400/40 bg-yellow-400/5' :
          isTie ? 'border-border/40 bg-card/20' :
          'border-rose-500/30 bg-rose-500/5'
        }`}>
          <p className="text-3xl font-black font-cinzel">
            {didWin ? '🏆 Victory!' : isTie ? '🤝 Tie Game' : '💀 Defeat'}
          </p>
          {isCleanSweep && didWin && (
            <p className="text-amber-300 font-bold text-sm tracking-wide uppercase">✦ Clean Sweep Bonus!</p>
          )}
          {didWin && (
            <p className="text-amber-400 font-semibold">+{coinReward} coins awarded</p>
          )}
          <p className="text-muted-foreground text-sm">
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

      {/* Rules reference */}
      <div className="rounded-xl border border-border/30 bg-card/20 p-4 space-y-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Battle Rules</p>
        <p>⚡ <span className="text-yellow-400 font-medium">Round 3 — Power Round:</span> No luck. Pure rarity + faction + synergy.</p>
        <p>🔥 <span className="text-red-400 font-medium">Round 5 — Final Clash:</span> Luck doubled (0–30).</p>
        <p>✦ <span className="text-purple-400 font-medium">Faction Synergy:</span> 3+ cards of the same faction → +10 per card.</p>
        <p>🏆 <span className="text-amber-400 font-medium">Clean Sweep (5–0):</span> +100 coins instead of +50.</p>
        <p className="pt-1 font-semibold text-foreground">Faction Advantage (+15)</p>
        <div className="flex flex-wrap gap-1.5">
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
