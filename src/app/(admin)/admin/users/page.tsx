'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type User = {
  id: string
  name: string | null
  email: string
  role: string
  isBanned: boolean
  coinBalance: number
  createdAt: string
  _count: { collectionEntries: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const loadUsers = useCallback(async (q = '') => {
    setLoading(true)
    const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function updateUser(userId: string, data: Partial<{ role: string; isBanned: boolean; coinBalance: number }>) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success('User updated')
      loadUsers(search)
    } else {
      toast.error('Failed to update user')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex gap-2">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => loadUsers(search)} variant="outline" size="sm">Search</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-right p-3">Cards</th>
              <th className="text-right p-3">Coins</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{u.name ?? '—'}</p>
                  <p className="text-muted-foreground text-xs">{u.email}</p>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-muted text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-right">{u._count.collectionEntries}</td>
                <td className="p-3 text-right">{u.coinBalance.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {u.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => updateUser(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                    >
                      {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => updateUser(u.id, { isBanned: !u.isBanned })}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => {
                        const coins = prompt('Add coins:', '100')
                        if (coins) updateUser(u.id, { coinBalance: u.coinBalance + Number(coins) })
                      }}
                    >
                      + Coins
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
