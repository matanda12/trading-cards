'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { RarityBadge } from '@/components/cards/RarityBadge'
import type { Rarity } from '@/generated/prisma/client'

type Entry = {
  id: string
  card: {
    id: string
    name: string
    imageUrl: string
    rarity: string
    category: string
  }
}

export function GiftClient({ entries }: { entries: Entry[] }) {
  const router = useRouter()
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [toUsername, setToUsername] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function send() {
    if (!selectedEntry || !toUsername.trim()) return
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: selectedEntry.id, toUsername: toUsername.trim(), message: message.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send gift'); return }
      setSuccess(`"${data.card.name}" has been gifted!`)
      setSelectedEntry(null)
      setToUsername('')
      setMessage('')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="text-5xl">🎁</div>
        <div>
          <h2 className="text-xl font-bold">No cards to gift</h2>
          <p className="text-muted-foreground text-sm mt-1">All your cards are locked in trades or listings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300 text-center">
          🎁 {success}
        </div>
      )}

      {/* Recipient */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">Recipient username</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-slate-400 text-sm">@</span>
          <input
            type="text"
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
            placeholder="username"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600"
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal note…"
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-600 resize-none"
        />
      </div>

      {/* Card picker */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">Choose a card to gift</label>
        <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              className={`relative rounded-xl border-2 overflow-hidden aspect-[5/7] transition-all ${selectedEntry?.id === entry.id ? 'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)]' : 'border-white/10 hover:border-white/30'}`}
            >
              <Image src={entry.card.imageUrl} alt={entry.card.name} fill className="object-cover" sizes="100px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <p className="font-cinzel text-[9px] font-bold text-white truncate mb-0.5">{entry.card.name}</p>
                <RarityBadge rarity={entry.card.rarity as Rarity} className="text-[8px] px-1 py-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedEntry && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-3">
          <div className="relative w-10 aspect-[5/7] rounded-lg overflow-hidden border border-amber-500/40 shrink-0">
            <Image src={selectedEntry.card.imageUrl} alt={selectedEntry.card.name} fill className="object-cover" sizes="40px" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300 truncate">{selectedEntry.card.name}</p>
            <p className="text-xs text-slate-400">Selected to gift</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <button
        onClick={send}
        disabled={!selectedEntry || !toUsername.trim() || sending}
        className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending…' : '🎁 Send Gift'}
      </button>
    </div>
  )
}
