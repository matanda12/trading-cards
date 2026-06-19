'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { RARITY_WEIGHTS } from '@/lib/rarity'

type CardItem = { id: string; name: string; rarity: string; isActive: boolean }
type Slot = { cardId: string; weight: number }
type Pack = {
  id: string
  name: string
  description: string | null
  coinCost: number
  cardCount: number
  isActive: boolean
  slots: { cardId: string; weight: number; card: { name: string } }[]
}

export default function EditPackPage() {
  const router = useRouter()
  const { packId } = useParams<{ packId: string }>()

  const [pack, setPack] = useState<Pack | null>(null)
  const [cards, setCards] = useState<CardItem[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/packs/${packId}`).then((r) => r.json()),
      fetch('/api/admin/cards').then((r) => r.json()),
    ]).then(([packData, cardsData]: [Pack, CardItem[]]) => {
      setPack(packData)
      setCards(cardsData.filter((c) => c.isActive))
      setSlots(packData.slots.map((s) => ({ cardId: s.cardId, weight: s.weight })))
    })
  }, [packId])

  function addSlot(cardId: string) {
    if (slots.find((s) => s.cardId === cardId)) return
    const card = cards.find((c) => c.id === cardId)
    const weight = card ? (RARITY_WEIGHTS[card.rarity as keyof typeof RARITY_WEIGHTS] ?? 10) : 10
    setSlots((prev) => [...prev, { cardId, weight }])
  }

  function updateWeight(cardId: string, weight: number) {
    setSlots((prev) => prev.map((s) => (s.cardId === cardId ? { ...s, weight } : s)))
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
      const res = await fetch(`/api/admin/packs/${packId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          coinCost: Number(formData.get('coinCost')),
          cardCount: Number(formData.get('cardCount')),
          slots,
        }),
      })
      if (!res.ok) return toast.error('Failed to update pack')
      toast.success('Pack updated!')
      router.push('/admin/packs')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive() {
    if (!pack) return
    const res = await fetch(`/api/admin/packs/${packId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !pack.isActive }),
    })
    if (!res.ok) return toast.error('Failed to update pack status')
    setPack((p) => p && { ...p, isActive: !p.isActive })
    toast.success(pack.isActive ? 'Pack deactivated' : 'Pack activated')
  }

  if (!pack) return <p className="text-muted-foreground text-sm">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Pack</h1>
        <Button
          type="button"
          variant="outline"
          onClick={toggleActive}
          className={pack.isActive ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}
        >
          {pack.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Pack Name</Label>
            <Input id="name" name="name" defaultValue={pack.name} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="coinCost">Coin Cost</Label>
            <Input id="coinCost" name="coinCost" type="number" min={0} defaultValue={pack.coinCost} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cardCount">Cards Per Open</Label>
            <Input id="cardCount" name="cardCount" type="number" min={1} max={20} defaultValue={pack.cardCount} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={pack.description ?? ''} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Cards in Pack</Label>
          <select
            className="w-full border border-border rounded-md bg-background p-2 text-sm text-foreground"
            onChange={(e) => { if (e.target.value) { addSlot(e.target.value); e.target.value = '' } }}
          >
            <option value="">Add a card…</option>
            {cards.filter((c) => !slots.find((s) => s.cardId === c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.rarity})</option>
            ))}
          </select>

          {slots.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border">
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
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
