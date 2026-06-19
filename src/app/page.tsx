import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Trading Card Platform</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Collect rare cards, trade with friends, and build the ultimate collection.
        </p>
      </div>
      <div className="flex gap-4">
        <Button size="lg" render={<Link href="/register" />}>
          Get Started
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/login" />}>
          Sign In
        </Button>
      </div>
    </main>
  )
}
