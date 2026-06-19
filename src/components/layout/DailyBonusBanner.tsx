'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function DailyBonusBanner() {
  useEffect(() => {
    fetch('/api/daily-bonus', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.awarded) {
          toast.success(
            `🎁 Daily bonus! +${data.coins} coins (Day ${data.streak} streak)`,
            { duration: 5000 }
          )
        }
      })
      .catch(() => {})
  }, [])

  return null
}
