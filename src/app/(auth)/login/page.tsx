'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined)
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const banned = searchParams.get('reason') === 'banned'

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">Register</Link>
          </p>
        </div>

        {registered && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded p-3">
            Account created! Sign in below.
          </div>
        )}
        {banned && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            Your account has been suspended.
          </div>
        )}
        {state?.message && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </main>
  )
}
