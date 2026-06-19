'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function TradeActions({
  tradeId,
  isInitiator,
  isReceiver,
}: {
  tradeId: string
  isInitiator: boolean
  isReceiver: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function respond(action: 'ACCEPT' | 'REJECT' | 'CANCEL') {
    setLoading(true)
    try {
      const res = await fetch(`/api/trades/${tradeId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error ?? 'Failed')
      const messages = { ACCEPT: 'Trade accepted!', REJECT: 'Trade rejected.', CANCEL: 'Trade cancelled.' }
      toast.success(messages[action])
      router.refresh()
      router.push('/trades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {isReceiver && (
        <>
          <Button onClick={() => respond('ACCEPT')} disabled={loading} className="flex-1">
            Accept Trade
          </Button>
          <Button onClick={() => respond('REJECT')} disabled={loading} variant="outline" className="flex-1">
            Reject
          </Button>
        </>
      )}
      {isInitiator && (
        <Button onClick={() => respond('CANCEL')} disabled={loading} variant="destructive" className="flex-1">
          Cancel Offer
        </Button>
      )}
    </div>
  )
}
