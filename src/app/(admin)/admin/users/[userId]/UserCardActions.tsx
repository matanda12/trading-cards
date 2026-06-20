'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RARITY_BADGE_COLORS } from '@/lib/rarity'
import type { Rarity } from '@/generated/prisma/client'

type Card = { id: string; name: string; rarity: string }

export function GrantCardButton({ userId, allCards }: { userId: string; allCards: Card[] }) {
  const [cardId, setCardId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function grant() {
    if (!cardId) return toast.error('Select a card first')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      })
      if (!res.ok) return toast.error('Failed to grant card')
      toast.success('Card granted')
      setCardId('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
        className="flex-1 text-sm bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Select card to grant…</option>
        {allCards.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.rarity})
          </option>
        ))}
      </select>
      <button
        onClick={grant}
        disabled={loading || !cardId}
        className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
      >
        {loading ? '…' : 'Grant'}
      </button>
    </div>
  )
}

export function RemoveCardButton({
  userId,
  entryId,
  cardName,
}: {
  userId: string
  entryId: string
  cardName: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    if (!confirm(`Remove "${cardName}" from this user?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/cards/${entryId}`, { method: 'DELETE' })
      if (!res.ok) return toast.error('Failed to remove card')
      toast.success('Card removed')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Remove'}
    </button>
  )
}

export function CollectionTable({
  userId,
  entries,
}: {
  userId: string
  entries: { id: string; source: string; obtainedAt: Date; card: Card }[]
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/20 border-b border-border/50">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Card</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Source</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Obtained</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-accent/10 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.card.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[entry.card.rarity as Rarity]}`}>
                    {entry.card.rarity}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs uppercase tracking-wide">
                {entry.source}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(entry.obtainedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <RemoveCardButton userId={userId} entryId={entry.id} cardName={entry.card.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
