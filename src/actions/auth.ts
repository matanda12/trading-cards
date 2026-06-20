'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email().trim(),
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
})

export type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined

export async function registerAction(state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { username, email, password } = parsed.data

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ])
  if (existingEmail) return { errors: { email: ['Email already registered'] } }
  if (existingUsername) return { errors: { username: ['Username already taken'] } }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { username, email, passwordHash } })

  redirect('/login?registered=true')
}

export async function loginAction(state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/collection',
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { message: 'Invalid email or password' }
    }
    throw err
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' })
}
