'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Card = { id: string; name: string; rarity: string }

export default function AdminCodesPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [cardId, setCardId] = useState('')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/cards').then((r) => r.json()).then(setCards)
  }, [])

  async function generate() {
    if (!cardId) return toast.error('Select a card')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, count }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error('Failed to generate codes')
      setGeneratedCodes(data.codes)
      toast.success(`${data.codes.length} codes generated`)
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    const card = cards.find((c) => c.id === cardId)
    const csv = `Code,Card\n${generatedCodes.map((c) => `${c},"${card?.name ?? ''}"`).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codes-${card?.name ?? 'cards'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Generate Codes</h1>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Card</Label>
          <Select onValueChange={(v: string | null) => { if (v) setCardId(v) }}>
            <SelectTrigger><SelectValue placeholder="Select card…" /></SelectTrigger>
            <SelectContent>
              {cards.filter((c) => (c as { isActive?: boolean }).isActive !== false).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.rarity})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="count">Number of Codes</Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>

        <Button onClick={generate} disabled={loading || !cardId}>
          {loading ? 'Generating…' : 'Generate Codes'}
        </Button>
      </div>

      {generatedCodes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{generatedCodes.length} codes ready</p>
            <Button onClick={downloadCsv} variant="outline" size="sm">Download CSV</Button>
          </div>
          <div className="border rounded p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
            {generatedCodes.slice(0, 50).map((c) => (
              <div key={c}>{c}</div>
            ))}
            {generatedCodes.length > 50 && (
              <div className="text-muted-foreground">…and {generatedCodes.length - 50} more (download CSV to see all)</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
