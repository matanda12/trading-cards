import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { BattleReplay } from '@/components/battle/BattleReplay'
import type { RoundResult } from '@/lib/battle'

export default async function BattleReplayPage({
  params,
}: {
  params: Promise<{ battleId: string }>
}) {
  const user = await requireAuth()
  const { battleId } = await params

  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      challenger: { select: { id: true, username: true, name: true } },
      opponent: { select: { id: true, username: true, name: true } },
    },
  })

  if (!battle) notFound()

  // Only challenger or real opponent can view
  if (
    battle.challengerId !== user.id &&
    battle.opponentId !== user.id &&
    !battle.isAiOpponent
  ) {
    notFound()
  }

  const rounds = battle.rounds as RoundResult[]
  const allCardIds = [...new Set(rounds.flatMap((r) => [r.challengerCardId, r.opponentCardId]))]
  const cards = await prisma.card.findMany({
    where: { id: { in: allCardIds }, isActive: true },
    select: { id: true, name: true, imageUrl: true, rarity: true, category: true },
  })
  const cardById = Object.fromEntries(cards.map((c) => [c.id, c]))

  const serialized = {
    ...battle,
    foughtAt: battle.foughtAt.toISOString(),
    rounds,
  }

  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      <BattleReplay battle={serialized} cardById={cardById} currentUserId={user.id} />
    </div>
  )
}
