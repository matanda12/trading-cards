'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function SettingsForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) return toast.error('Failed to update name')
      toast.success('Display name updated!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-400">Email</Label>
        <Input id="email" value={email} disabled className="opacity-50 bg-white/5 border-white/10" />
        <p className="text-xs text-slate-500">Email cannot be changed.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-slate-400">Display Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your display name"
          maxLength={50}
          className="bg-white/5 border-white/10"
        />
      </div>

      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
