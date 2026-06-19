'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function BuyButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error ?? 'Failed to start checkout')
      window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleBuy} disabled={loading} className="w-full" size="lg">
      {loading ? 'Redirecting to checkout…' : 'Buy Now'}
    </Button>
  )
}
