import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  role: string
  isBanned: boolean
}

export const getSession = cache(async () => {
  const session = await auth()
  return session
})

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  return session.user as SessionUser
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') redirect('/collection')
  return user
}
