'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'

type NotificationItem = {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const TYPE_ICON: Record<string, string> = {
  TRADE_RECEIVED: '🤝',
  TRADE_ACCEPTED: '✅',
  TRADE_REJECTED: '❌',
  LISTING_SOLD: '💰',
  DAILY_BONUS: '🎁',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setUnread(data.unread)
      setItems(data.items)
    } catch {
      // silently ignore network errors
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread > 0) markAllRead() }}
        className="relative p-1.5 rounded-lg hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border/50 bg-card shadow-xl shadow-black/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <p className="text-sm font-bold">Notifications</p>
              {items.some((n) => !n.isRead) && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 items-start text-sm ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`leading-snug ${!n.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
