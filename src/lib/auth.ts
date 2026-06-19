import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        if (user.isBanned) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isBanned: user.isBanned,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.isBanned = (user as { isBanned: boolean }).isBanned
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as unknown as { role: string }).role = token.role as string
        ;(session.user as unknown as { isBanned: boolean }).isBanned = token.isBanned as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
})
