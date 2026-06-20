'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'
import { Settings, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/collection', label: 'Collection' },
  { href: '/redeem', label: 'Redeem' },
  { href: '/trades', label: 'Trades' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/packs', label: 'Packs' },
]

export function Navbar({ isAdmin, coinBalance }: { isAdmin: boolean; coinBalance: number }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href="/collection"
          className="font-black text-lg shrink-0 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight"
        >
          Realms of Eternity
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-0.5 flex-1">
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

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right side */}
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
            className="hidden sm:block text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors font-semibold"
          >
            + Buy
          </Link>
          <Link
            href="/settings"
            className="hidden md:block p-1.5 rounded-lg hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Settings"
          >
            <Settings size={16} />
          </Link>
          <form action={logoutAction} className="hidden md:block">
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden mt-3 border-t border-border/50 pt-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-foreground font-semibold bg-accent/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          <div className="border-t border-border/30 pt-2 mt-1 space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Settings size={16} />
              Settings
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-4 py-2.5 h-auto font-normal text-muted-foreground">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
