'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function CancelListingButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm('Cancel this listing? The card will return to your collection.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Listing cancelled')
        router.push('/marketplace')
      } else {
        toast.error('Failed to cancel listing')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Cancelling…' : 'Cancel Listing'}
    </Button>
  )
}
