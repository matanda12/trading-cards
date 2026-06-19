'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Card, CollectionEntry } from '@/generated/prisma/client'

type EntryWithCard = CollectionEntry & { card: Card }
type SearchUser = { id: string; name: string | null; email: string }

export function NewTradeForm({
  myEntries,
}: {
  myEntries: EntryWithCard[]
  currentUserId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [receiver, setReceiver] = useState<SearchUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [receiverEntries, setReceiverEntries] = useState<EntryWithCard[]>([])
  const [offeredIds, setOfferedIds] = useState<string[]>([])
  const [wantedIds, setWantedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
    setSearchResults(await res.json())
  }, [])

  async function selectReceiver(user: SearchUser) {
    setReceiver(user)
    setSearchResults([])
    const res = await fetch(`/api/collection?userId=${user.id}`)
    const data = await res.json()
    setReceiverEntries(data)
    setStep(2)
  }

  function toggleOffered(id: string) {
    setOfferedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function toggleWanted(id: string) {
    setWantedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function submitTrade() {
    if (!receiver) return
    if (offeredIds.length === 0) return toast.error('Select at least one card to offer')
    if (wantedIds.length === 0) return toast.error('Select at least one card to request')
    setLoading(true)
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: receiver.id,
          offeredEntryIds: offeredIds,
          wantedEntryIds: wantedIds,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error ?? 'Failed to create trade')
      toast.success('Trade offer sent!')
      router.push('/trades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Pick receiver */}
      <div className="space-y-3">
        <h2 className="font-semibold">1. Select trading partner</h2>
        {receiver ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{receiver.name ?? receiver.email}</p>
              <p className="text-xs text-muted-foreground">{receiver.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setReceiver(null); setStep(1); setReceiverEntries([]) }}>
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value) }}
            />
            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => selectReceiver(u)}
                  >
                    <p className="font-medium text-sm">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {step >= 2 && (
        <>
          <div className="space-y-3">
            <h2 className="font-semibold">2. Cards you offer ({offeredIds.length} selected)</h2>
            {myEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No available cards to offer.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {myEntries.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleOffered(e.id)}
                    className={`border rounded p-2 text-left transition-all ${offeredIds.includes(e.id) ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-muted-foreground'}`}
                  >
                    <p className="text-xs font-semibold truncate">{e.card.name}</p>
                    <RarityBadge rarity={e.card.rarity} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">3. Cards you want ({wantedIds.length} selected)</h2>
            {receiverEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">{receiver?.name ?? 'This user'} has no available cards.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {receiverEntries.map((e: EntryWithCard) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleWanted(e.id)}
                    className={`border rounded p-2 text-left transition-all ${wantedIds.includes(e.id) ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-muted-foreground'}`}
                  >
                    <p className="text-xs font-semibold truncate">{e.card.name}</p>
                    <RarityBadge rarity={e.card.rarity} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="message">Message (optional)</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note to your offer…" />
          </div>

          <Button onClick={submitTrade} disabled={loading} className="w-full">
            {loading ? 'Sending offer…' : 'Send Trade Offer'}
          </Button>
        </>
      )}
    </div>
  )
}
