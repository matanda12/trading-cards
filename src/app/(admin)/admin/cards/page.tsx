import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RarityBadge } from '@/components/cards/RarityBadge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default async function AdminCardsPage() {
  await requireAdmin()

  const cards = await prisma.card.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptionCodes: true, collectionEntries: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cards</h1>
        <Button render={<Link href="/admin/cards/new" />}>+ New Card</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Card</th>
              <th className="text-left p-3">Rarity</th>
              <th className="text-left p-3">Category</th>
              <th className="text-right p-3">Codes</th>
              <th className="text-right p-3">Collected</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-t hover:bg-muted/20">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-11 rounded overflow-hidden shrink-0">
                      <Image src={card.imageUrl} alt={card.name} fill className="object-cover" sizes="32px" />
                    </div>
                    <Link href={`/admin/cards/${card.id}/edit`} className="font-medium hover:underline">
                      {card.name}
                    </Link>
                  </div>
                </td>
                <td className="p-3"><RarityBadge rarity={card.rarity} /></td>
                <td className="p-3 text-muted-foreground">{card.category}</td>
                <td className="p-3 text-right">{card._count.redemptionCodes}</td>
                <td className="p-3 text-right">{card._count.collectionEntries}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {card.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
