import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ status: z.literal('CANCELLED') })

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  await requireAdmin()
  const { listingId } = await ctx.params

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 422 })

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing || listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Not found or not active' }, { status: 404 })
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json(updated)
}
