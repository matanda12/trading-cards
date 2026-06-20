export const BATTLE_POWER: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 20,
  RARE: 35,
  EPIC: 55,
  LEGENDARY: 80,
}

// 7-way cycle: key faction beats value faction (+15 bonus)
export const FACTION_BEATS: Record<string, string> = {
  Arcane: 'Shadow',
  Shadow: 'Light',
  Light:  'Iron',
  Iron:   'Fire',
  Fire:   'Nature',
  Nature: 'Water',
  Water:  'Arcane',
}

export type RoundType = 'normal' | 'power' | 'final'

export type RoundResult = {
  round: number
  roundType: RoundType
  challengerCardId: string
  opponentCardId: string
  challengerScore: number
  opponentScore: number
  winner: 'challenger' | 'opponent' | 'tie'
  challengerBase: number
  challengerFaction: number
  challengerSynergy: number
  challengerRandom: number
  opponentBase: number
  opponentFaction: number
  opponentSynergy: number
  opponentRandom: number
}

// djb2 seeded PRNG — reproducible float 0.0–1.0
function seededRandom(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i)
    hash = hash | 0
  }
  return Math.abs(hash) / 2147483647
}

// Faction Synergy: 3+ cards from same faction in a deck → +10 per card of that faction
function computeSynergy(cards: { category: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of cards) counts[c.category] = (counts[c.category] ?? 0) + 1
  const synergy: Record<string, number> = {}
  for (const [faction, count] of Object.entries(counts)) {
    synergy[faction] = count >= 3 ? 10 : 0
  }
  return synergy
}

// Round rules:
//   Round 3 = "Power Round"   — pure skill, no luck factor
//   Round 5 = "Final Clash"   — luck factor doubled (0–30)
function getRoundType(round: number): RoundType {
  if (round === 3) return 'power'
  if (round === 5) return 'final'
  return 'normal'
}

function getLuckMultiplier(roundType: RoundType): number {
  if (roundType === 'power') return 0
  if (roundType === 'final') return 2
  return 1
}

export type CardRef = { id: string; rarity: string; category: string }

export function resolveBattle(
  battleId: string,
  challengerCards: CardRef[],
  opponentCards: CardRef[],
  challengerId: string,
  opponentId: string | null
): {
  rounds: RoundResult[]
  winnerId: string | null
  challengerRoundsWon: number
  opponentRoundsWon: number
  isCleanSweep: boolean
  coinReward: number
} {
  const cSynergy = computeSynergy(challengerCards)
  const oSynergy = computeSynergy(opponentCards)

  const rounds: RoundResult[] = []
  let cWins = 0
  let oWins = 0

  for (let i = 0; i < 5; i++) {
    const round = i + 1
    const roundType = getRoundType(round)
    const luckMult = getLuckMultiplier(roundType)
    const cCard = challengerCards[i]
    const oCard = opponentCards[i]

    const cBase    = BATTLE_POWER[cCard.rarity] ?? 10
    const oBase    = BATTLE_POWER[oCard.rarity] ?? 10
    const cFaction = FACTION_BEATS[cCard.category] === oCard.category ? 15 : 0
    const oFaction = FACTION_BEATS[oCard.category] === cCard.category ? 15 : 0
    const cSyn     = cSynergy[cCard.category] ?? 0
    const oSyn     = oSynergy[oCard.category] ?? 0
    const cRnd     = Math.floor(seededRandom(`${battleId}:${round}:c`) * 16) * luckMult
    const oRnd     = Math.floor(seededRandom(`${battleId}:${round}:o`) * 16) * luckMult

    const cScore = cBase + cFaction + cSyn + cRnd
    const oScore = oBase + oFaction + oSyn + oRnd

    const winner: RoundResult['winner'] =
      cScore > oScore ? 'challenger' : oScore > cScore ? 'opponent' : 'tie'

    if (winner === 'challenger') cWins++
    else if (winner === 'opponent') oWins++

    rounds.push({
      round, roundType,
      challengerCardId: cCard.id, opponentCardId: oCard.id,
      challengerScore: cScore, opponentScore: oScore,
      winner,
      challengerBase: cBase, challengerFaction: cFaction, challengerSynergy: cSyn, challengerRandom: cRnd,
      opponentBase: oBase, opponentFaction: oFaction, opponentSynergy: oSyn, opponentRandom: oRnd,
    })
  }

  const isCleanSweep = cWins === 5 || oWins === 5
  const coinReward   = isCleanSweep ? 100 : 50

  let winnerId: string | null = null
  if (cWins > oWins) winnerId = challengerId
  else if (oWins > cWins) winnerId = opponentId

  return { rounds, winnerId, challengerRoundsWon: cWins, opponentRoundsWon: oWins, isCleanSweep, coinReward }
}
