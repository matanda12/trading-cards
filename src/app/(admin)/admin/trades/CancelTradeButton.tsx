'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CancelTradeButton({ tradeId }: { tradeId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function cancel() {
    if (!confirm('Cancel this trade?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/trades/${tradeId}`, { method: 'PATCH' })
      if (!res.ok) return toast.error('Failed to cancel trade')
      toast.success('Trade cancelled')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Cancel'}
    </button>
  )
}
