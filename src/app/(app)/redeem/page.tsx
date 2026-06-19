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
    <div className="max-w-md mx-auto space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Redeem a Code</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your unique card code to add it to your collection.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="code">Card Code</Label>
          <Input
            id="code"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono text-lg tracking-wider"
            maxLength={19}
            required
          />
          <p className="text-xs text-muted-foreground">Format: XXXX-XXXX-XXXX-XXXX</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading || code.length < 4}>
          {loading ? 'Redeeming…' : 'Redeem Code'}
        </Button>
      </form>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-900 rounded p-4">
          <p className="font-semibold">Success!</p>
          <p className="text-sm">{success} has been added to your collection.</p>
        </div>
      )}
    </div>
  )
}
