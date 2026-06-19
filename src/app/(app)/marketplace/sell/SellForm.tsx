'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Card, CollectionEntry } from '@/generated/prisma/client'
import { RarityBadge } from '@/components/cards/RarityBadge'

type EntryWithCard = CollectionEntry & { card: Card }

export function SellForm({ entries }: { entries: EntryWithCard[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = entries.find((e) => e.id === selectedId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !price) return

    const priceCents = Math.round(parseFloat(price) * 100)
    if (priceCents < 100) return toast.error('Minimum price is $1.00')

    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionEntryId: selectedId, priceCents }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error ?? 'Failed to create listing')
      toast.success('Listing created!')
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Card</Label>
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSelectedId(entry.id)}
              className={`border rounded-lg p-2 text-left transition-all ${selectedId === entry.id ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground'}`}
            >
              <p className="text-sm font-semibold truncate">{entry.card.name}</p>
              <RarityBadge rarity={entry.card.rarity} />
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="bg-muted/30 rounded p-3 text-sm">
          Selected: <span className="font-semibold">{selected.card.name}</span>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="price">Price (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="price"
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-7"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading || !selectedId || !price}>
        {loading ? 'Listing…' : 'List for Sale'}
      </Button>
    </form>
  )
}
