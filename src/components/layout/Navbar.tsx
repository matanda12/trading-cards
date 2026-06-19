'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'
import { Settings } from 'lucide-react'

const navLinks = [
  { href: '/collection', label: 'Collection' },
  { href: '/redeem', label: 'Redeem' },
  { href: '/trades', label: 'Trades' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/packs', label: 'Packs' },
]

export function Navbar({ isAdmin, coinBalance }: { isAdmin: boolean; coinBalance: number }) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-6">
      <Link
        href="/collection"
        className="font-black text-lg shrink-0 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight"
      >
        CardVault
      </Link>

      <div className="flex gap-0.5 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm px-3 py-1.5 rounded-md transition-colors',
              pathname.startsWith(link.href)
                ? 'text-foreground font-semibold bg-accent/40'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
            )}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'text-sm px-3 py-1.5 rounded-md transition-colors',
              pathname.startsWith('/admin')
                ? 'text-foreground font-semibold bg-accent/40'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
            )}
          >
            Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          href="/coins"
          className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          🪙 {coinBalance.toLocaleString()}
        </Link>
        <Link
          href="/coins"
          className="text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors font-semibold"
        >
          + Buy Coins
        </Link>
        <Link
          href="/settings"
          className="p-1.5 rounded-lg hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign Out
          </Button>
        </form>
      </div>
    </nav>
  )
}
