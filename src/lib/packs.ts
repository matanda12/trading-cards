import type { PackSlot } from '@/generated/prisma/client'

export function weightedDraw(slots: PackSlot[], count: number): string[] {
  if (slots.length === 0) return []

  const totalWeight = slots.reduce((sum, s) => sum + s.weight, 0)
  const results: string[] = []

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * totalWeight
    for (const slot of slots) {
      rand -= slot.weight
      if (rand <= 0) {
        results.push(slot.cardId)
        break
      }
    }
    // Fallback: if floating point issues skip all, pick last
    if (results.length <= i) {
      results.push(slots[slots.length - 1].cardId)
    }
  }

  return results
}
