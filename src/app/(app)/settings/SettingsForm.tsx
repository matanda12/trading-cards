'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function SettingsForm({
  initialName,
  initialUsername,
  email,
}: {
  initialName: string
  initialUsername: string
  email: string
}) {
  const [name, setName] = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [loading, setLoading] = useState(false)

  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usernameValid) return toast.error('Username must be 3–20 chars, letters/numbers/underscores only')
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null, username: username.trim() }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error ?? 'Failed to save')
      toast.success('Profile updated!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-slate-400">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            placeholder="your_username"
            maxLength={20}
            className="bg-white/5 border-white/10 pl-7"
          />
        </div>
        <p className="text-xs text-slate-500">Shown to other players. 3–20 chars, letters/numbers/underscores.</p>
        {username && !usernameValid && (
          <p className="text-xs text-red-400">Must be 3–20 characters.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-slate-400">Display Name <span className="text-slate-600">(optional)</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          maxLength={50}
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-400">Email</Label>
        <Input id="email" value={email} disabled className="opacity-50 bg-white/5 border-white/10" />
        <p className="text-xs text-slate-500">Email is private and never shown to other players.</p>
      </div>

      <Button type="submit" disabled={loading || !usernameValid}>
        {loading ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
