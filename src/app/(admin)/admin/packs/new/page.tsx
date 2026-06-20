'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RARITY_WEIGHTS } from '@/lib/rarity'

type Card = { id: string; name: string; rarity: string; isActive: boolean }
type Slot = { cardId: string; weight: number }

export default function NewPackPage() {
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/cards').then((r) => r.json()).then((data: Card[]) => {
      setCards(data.filter((c) => c.isActive))
    })
  }, [])

  function addSlot(cardId: string) {
    if (slots.find((s) => s.cardId === cardId)) return
    const card = cards.find((c) => c.id === cardId)
    const weight = card ? (RARITY_WEIGHTS[card.rarity as keyof typeof RARITY_WEIGHTS] ?? 10) : 10
    setSlots((prev) => [...prev, { cardId, weight }])
  }

  function updateWeight(cardId: string, weight: number) {
    setSlots((prev) => prev.map((s) => s.cardId === cardId ? { ...s, weight } : s))
  }

  function removeSlot(cardId: string) {
    setSlots((prev) => prev.filter((s) => s.cardId !== cardId))
  }

  const totalWeight = slots.reduce((sum, s) => sum + s.weight, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (slots.length === 0) return toast.error('Add at least one card to the pack')
    const form = e.currentTarget
    const formData = new FormData(form)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          coinCost: Number(formData.get('coinCost')),
          cardCount: Number(formData.get('cardCount')),
          validFrom: formData.get('validFrom') || null,
          validUntil: formData.get('validUntil') || null,
          slots,
        }),
      })
      if (!res.ok) return toast.error('Failed to create pack')
      toast.success('Pack created!')
      router.push('/admin/packs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Pack</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Pack Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="coinCost">Coin Cost</Label>
            <Input id="coinCost" name="coinCost" type="number" min={0} defaultValue={100} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cardCount">Cards Per Open</Label>
            <Input id="cardCount" name="cardCount" type="number" min={1} max={20} defaultValue={3} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="validFrom">Available From (optional)</Label>
            <Input id="validFrom" name="validFrom" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="validUntil">Available Until (optional)</Label>
            <Input id="validUntil" name="validUntil" type="datetime-local" />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Cards in Pack</Label>
          <select
            className="w-full border rounded p-2 text-sm"
            onChange={(e) => { if (e.target.value) { addSlot(e.target.value); e.target.value = '' } }}
          >
            <option value="">Add a card…</option>
            {cards.filter((c) => !slots.find((s) => s.cardId === c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.rarity})</option>
            ))}
          </select>

          {slots.length > 0 && (
            <div className="border rounded divide-y">
              {slots.map((slot) => {
                const card = cards.find((c) => c.id === slot.cardId)
                const pct = totalWeight > 0 ? ((slot.weight / totalWeight) * 100).toFixed(1) : '0'
                return (
                  <div key={slot.cardId} className="flex items-center gap-3 p-2">
                    <span className="flex-1 text-sm">{card?.name ?? slot.cardId}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                    <Input
                      type="number"
                      min={1}
                      value={slot.weight}
                      onChange={(e) => updateWeight(slot.cardId, Number(e.target.value))}
                      className="w-20"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(slot.cardId)}>×</Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Pack'}
        </Button>
      </form>
    </div>
  )
}
