import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { Role } from '@/generated/prisma/client'

const schema = z.object({
  role: z.nativeEnum(Role).optional(),
  isBanned: z.boolean().optional(),
  coinBalance: z.number().int().min(0).optional(),
})

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin()
  const { userId } = await ctx.params

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Admins can change their own coin balance, but not their own role or ban status
  if (userId === admin.id && (parsed.data.role !== undefined || parsed.data.isBanned !== undefined)) {
    return NextResponse.json({ error: 'Cannot change your own role or ban status' }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: userId }, data: parsed.data })
  return NextResponse.json({ id: user.id, role: user.role, isBanned: user.isBanned, coinBalance: user.coinBalance })
}
