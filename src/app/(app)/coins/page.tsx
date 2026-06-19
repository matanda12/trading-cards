'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function SuccessBanner() {
  const params = useSearchParams()
  if (params.get('success') !== 'true') return null
  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300 text-center">
      🎉 Payment successful! Your coins have been added to your account.
    </div>
  )
}

const BUNDLES = [
  { coins: 500, priceCents: 499, label: 'Starter', popular: false },
  { coins: 1500, priceCents: 1299, label: 'Popular', popular: true },
  { coins: 5000, priceCents: 3999, label: 'Mega', popular: false },
] as const

export default function CoinsPage() {
  const [loading, setLoading] = useState<number | null>(null)

  async function buy(coins: number, priceCents: number) {
    setLoading(coins)
    try {
      const res = await fetch('/api/checkout/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins, priceCents }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <Suspense>
        <SuccessBanner />
      </Suspense>

      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Coin Shop</p>
        <h1 className="text-4xl font-black tracking-tight">Buy Coins</h1>
        <p className="text-muted-foreground">Use coins to open card packs and grow your collection.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {BUNDLES.map((bundle) => (
          <div
            key={bundle.coins}
            className={`relative rounded-2xl border-2 p-6 space-y-4 transition-all ${
              bundle.popular
                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                : 'border-border/50 bg-card/40'
            }`}
          >
            {bundle.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500 text-white shadow">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <p className="text-4xl">🪙</p>
              <p className="text-3xl font-black mt-2">{bundle.coins.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">coins</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold">${(bundle.priceCents / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                ${((bundle.priceCents / bundle.coins) * 100).toFixed(1)}¢ per coin
              </p>
            </div>

            <Button
              className="w-full"
              variant={bundle.popular ? 'default' : 'outline'}
              disabled={loading !== null}
              onClick={() => buy(bundle.coins, bundle.priceCents)}
            >
              {loading === bundle.coins ? 'Redirecting…' : `Buy ${bundle.label}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Payments are processed securely by Stripe. Coins are added to your account immediately after payment.
      </p>
    </div>
  )
}
