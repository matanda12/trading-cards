import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  name: z.string().max(50).trim().nullable().optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores')
    .optional(),
})

export async function PATCH(request: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 })

  const { name, username } = parsed.data

  if (username) {
    const taken = await prisma.user.findFirst({ where: { username, id: { not: user.id } } })
    if (taken) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { ...(name !== undefined ? { name } : {}), ...(username ? { username } : {}) },
    select: { id: true, name: true, username: true, email: true },
  })

  return NextResponse.json(updated)
}
