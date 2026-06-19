'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'

const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const

export default function NewCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [rarity, setRarity] = useState<string>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    if (!imageUrl) {
      toast.error('Please upload a card image')
      return
    }
    if (!rarity) {
      toast.error('Please select a rarity')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          category: formData.get('category'),
          imageUrl,
          rarity,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error('Failed to create card')
      } else {
        toast.success('Card created!')
        router.push(`/admin/codes`)
      }
      console.log(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">New Card</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Card Name</Label>
          <Input id="name" name="name" required maxLength={100} />
        </div>

        <div className="space-y-1">
          <Label>Rarity</Label>
          <Select onValueChange={(v: string | null) => { if (v) setRarity(v) }} required>
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
          <Input id="category" name="category" placeholder="e.g. Fantasy, Sports…" required maxLength={50} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label>Card Image</Label>
          {imageUrl ? (
            <div className="space-y-2">
              <img src={imageUrl} alt="Card preview" className="h-40 rounded object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl('')}>
                Change Image
              </Button>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'trading_cards'}
              onSuccess={(result) => {
                const info = result.info as { secure_url: string }
                setImageUrl(info.secure_url)
              }}
            >
              {({ open }) => (
                <Button type="button" variant="outline" onClick={() => open()}>
                  Upload Image
                </Button>
              )}
            </CldUploadWidget>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Card'}
        </Button>
      </form>
    </div>
  )
}
