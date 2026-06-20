export const BATTLE_POWER: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 20,
  RARE: 35,
  EPIC: 55,
  LEGENDARY: 80,
}

// 7-way cycle: key faction beats value faction
export const FACTION_BEATS: Record<string, string> = {
  Arcane: 'Shadow',
  Shadow: 'Light',
  Light:  'Iron',
  Iron:   'Fire',
  Fire:   'Nature',
  Nature: 'Water',
  Water:  'Arcane',
}

export type RoundResult = {
  round: number
  challengerCardId: string
  opponentCardId: string
  challengerScore: number
  opponentScore: number
  winner: 'challenger' | 'opponent' | 'tie'
  challengerBase: number
  challengerFaction: number
  challengerRandom: number
  opponentBase: number
  opponentFaction: number
  opponentRandom: number
}

// djb2-based seeded PRNG — returns float 0.0–1.0
function seededRandom(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i)
    hash = hash | 0 // keep 32-bit
  }
  return Math.abs(hash) / 2147483647
}

export function resolveRound(
  round: number,
  battleId: string,
  challengerCard: { id: string; rarity: string; category: string },
  opponentCard: { id: string; rarity: string; category: string }
): RoundResult {
  const cBase = BATTLE_POWER[challengerCard.rarity] ?? 10
  const oBase = BATTLE_POWER[opponentCard.rarity] ?? 10

  const cFaction = FACTION_BEATS[challengerCard.category] === opponentCard.category ? 15 : 0
  const oFaction = FACTION_BEATS[opponentCard.category] === challengerCard.category ? 15 : 0

  const cRandom = Math.floor(seededRandom(`${battleId}:${round}:c`) * 16)
  const oRandom = Math.floor(seededRandom(`${battleId}:${round}:o`) * 16)

  const cScore = cBase + cFaction + cRandom
  const oScore = oBase + oFaction + oRandom

  const winner: RoundResult['winner'] =
    cScore > oScore ? 'challenger' : oScore > cScore ? 'opponent' : 'tie'

  return {
    round,
    challengerCardId: challengerCard.id,
    opponentCardId: opponentCard.id,
    challengerScore: cScore,
    opponentScore: oScore,
    winner,
    challengerBase: cBase,
    challengerFaction: cFaction,
    challengerRandom: cRandom,
    opponentBase: oBase,
    opponentFaction: oFaction,
    opponentRandom: oRandom,
  }
}

type CardRef = { id: string; rarity: string; category: string }

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
} {
  const rounds: RoundResult[] = []
  let challengerWins = 0
  let opponentWins = 0

  for (let i = 0; i < 5; i++) {
    const result = resolveRound(i + 1, battleId, challengerCards[i], opponentCards[i])
    rounds.push(result)
    if (result.winner === 'challenger') challengerWins++
    else if (result.winner === 'opponent') opponentWins++
  }

  let winnerId: string | null = null
  if (challengerWins > opponentWins) winnerId = challengerId
  else if (opponentWins > challengerWins) winnerId = opponentId

  return { rounds, winnerId, challengerRoundsWon: challengerWins, opponentRoundsWon: opponentWins }
}
