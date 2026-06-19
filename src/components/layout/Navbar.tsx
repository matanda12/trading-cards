'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
    <nav className="border-b bg-background px-4 py-3 flex items-center gap-6">
      <Link href="/collection" className="font-bold text-lg shrink-0">
        CardVault
      </Link>
      <div className="flex gap-4 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm hover:text-foreground transition-colors',
              pathname.startsWith(link.href) ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'text-sm hover:text-foreground transition-colors',
              pathname.startsWith('/admin') ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{coinBalance.toLocaleString()}</span> coins
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">Sign Out</Button>
        </form>
      </div>
    </nav>
  )
}
