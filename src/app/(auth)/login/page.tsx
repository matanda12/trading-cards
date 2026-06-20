'use client'

import { useActionState, Suspense } from 'react'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const banned = searchParams.get('reason') === 'banned'

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <Link
          href="/"
          className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight"
        >
          Realms of Eternity
        </Link>
        <h1 className="text-xl font-bold mt-3">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">Register</Link>
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/30 space-y-5">
        {registered && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm p-3 text-center">
            Account created! Sign in below.
          </div>
        )}
        {banned && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3 text-center">
            Your account has been suspended.
          </div>
        )}
        {state?.message && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3 text-center">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
