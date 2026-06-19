'use client'

import { useActionState } from 'react'
import { registerAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight"
          >
            CardVault
          </Link>
          <h1 className="text-xl font-bold mt-3">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/30 space-y-4">
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required />
              {state?.errors?.name && (
                <p className="text-destructive text-xs">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
              {state?.errors?.email && (
                <p className="text-destructive text-xs">{state.errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
              {state?.errors?.password && (
                <p className="text-destructive text-xs">{state.errors.password[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">Min. 8 characters, at least one letter and one number.</p>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
