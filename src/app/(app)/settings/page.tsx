'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name)
  }, [session?.user?.name])

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
      await update({ name: name.trim() })
      toast.success('Display name updated!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-8 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Account</p>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-5">
        <h2 className="text-sm font-bold">Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={session?.user?.email ?? ''}
              disabled
              className="opacity-50"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>

          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
