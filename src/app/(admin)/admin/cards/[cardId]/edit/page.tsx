'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'

const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const

type Card = {
  id: string
  name: string
  description: string | null
  imageUrl: string
  rarity: string
  category: string
  isActive: boolean
}

export default function EditCardPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const router = useRouter()

  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [rarity, setRarity] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/cards/${cardId}`)
      .then((r) => r.json())
      .then((found: Card) => {
        setCard(found)
        setName(found.name)
        setDescription(found.description ?? '')
        setCategory(found.category)
        setRarity(found.rarity)
        setImageUrl(found.imageUrl)
        setIsActive(found.isActive)
      })
  }, [cardId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rarity) return toast.error('Select a rarity')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, rarity, imageUrl, isActive }),
      })
      if (!res.ok) {
        toast.error('Failed to update card')
      } else {
        toast.success('Card updated!')
        router.push('/admin/cards')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!confirm(isActive ? 'Deactivate this card? It will no longer appear to users.' : 'Reactivate this card?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        toast.success(isActive ? 'Card deactivated' : 'Card reactivated')
        router.push('/admin/cards')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!card) {
    return <div className="text-muted-foreground text-sm py-10">Loading card…</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Card</h1>
        <Button
          type="button"
          variant="outline"
          onClick={handleDeactivate}
          disabled={loading}
          className={isActive ? 'text-destructive hover:text-destructive' : ''}
        >
          {isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Card Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-1">
          <Label>Rarity</Label>
          <Select
            value={rarity}
            onValueChange={(v: string | null) => { if (v) setRarity(v) }}
          >
            <SelectTrigger><SelectValue placeholder="Select rarity…" /></SelectTrigger>
            <SelectContent>
              {rarities.map((r) => (
                <SelectItem key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Fantasy, Sports…"
            required
            maxLength={50}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Card Image</Label>
          {imageUrl && (
            <img src={imageUrl} alt="Card preview" className="h-40 rounded-lg object-cover" />
          )}
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'trading_cards'}
            onSuccess={(result) => {
              const info = result.info as { secure_url: string }
              setImageUrl(info.secure_url)
            }}
          >
            {({ open }) => (
              <Button type="button" variant="outline" size="sm" onClick={() => open()}>
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
            )}
          </CldUploadWidget>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/cards')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
