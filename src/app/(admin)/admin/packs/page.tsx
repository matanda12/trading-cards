import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminPacksPage() {
  await requireAdmin()

  const packs = await prisma.pack.findMany({
    include: { _count: { select: { slots: true, packOpens: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Packs</h1>
        <Button render={<Link href="/admin/packs/new" />}>+ New Pack</Button>
      </div>

      <div className="grid gap-4">
        {packs.map((pack) => (
          <div key={pack.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{pack.name}</p>
              <p className="text-muted-foreground text-sm">{pack.description}</p>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>{pack.coinCost} coins · {pack.cardCount} cards</span>
                <span>{pack._count.slots} card types · {pack._count.packOpens} opened</span>
                <span className={pack.isActive ? 'text-green-600' : 'text-red-500'}>
                  {pack.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {packs.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No packs yet. Create one!</p>
        )}
      </div>
    </div>
  )
}
