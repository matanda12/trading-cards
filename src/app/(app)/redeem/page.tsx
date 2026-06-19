'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)

    try {
      const res = await fetch('/api/cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to redeem code')
      } else {
        setSuccess(data.card.name)
        setCode('')
        toast.success(`${data.card.name} added to your collection!`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Redeem</p>
        <h1 className="text-3xl font-black tracking-tight">Enter Your Code</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your unique card code to add it to your collection.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 space-y-5 shadow-xl shadow-black/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Card Code</Label>
            <Input
              id="code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-lg tracking-widest text-center"
              maxLength={19}
              required
            />
            <p className="text-xs text-muted-foreground text-center">Format: XXXX-XXXX-XXXX-XXXX</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || code.length < 4}>
            {loading ? 'Redeeming…' : 'Redeem Code'}
          </Button>
        </form>

        {success && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-green-300">Card Unlocked!</p>
            <p className="text-sm text-green-400/80 mt-0.5">{success} added to your collection.</p>
          </div>
        )}
      </div>
    </div>
  )
}
