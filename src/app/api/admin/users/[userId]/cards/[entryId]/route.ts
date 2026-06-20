import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; entryId: string }> }
) {
  await requireAdmin()
  const { userId, entryId } = await params

  const entry = await prisma.collectionEntry.findUnique({ where: { id: entryId } })
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  if (entry.userId !== userId) return NextResponse.json({ error: 'Entry does not belong to this user' }, { status: 400 })

  await prisma.collectionEntry.delete({ where: { id: entryId } })
  return NextResponse.json({ success: true })
}
