'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'
import { DailyQuests } from './DailyQuests'
import { Settings, Menu, X, ChevronDown } from 'lucide-react'

const navLinks = [
  { href: '/collection', label: 'Collection' },
  { href: '/packs', label: 'Packs' },
  { href: '/trades', label: 'Trades' },
  { href: '/marketplace', label: 'Market' },
  { href: '/leaderboard', label: 'Ranks' },
  { href: '/feed', label: 'Feed' },
]

const moreLinks = [
  { href: '/wishlist', label: '⭐ Wishlist' },
  { href: '/gift', label: '🎁 Gift a Card' },
  { href: '/craft', label: '🔨 Craft' },
  { href: '/redeem', label: '🎟️ Redeem' },
]

export function Navbar({ isAdmin, coinBalance, loginStreak }: { isAdmin: boolean; coinBalance: number; loginStreak: number }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#080810]/90 backdrop-blur-md animate-navbar-glow border-b border-purple-500/20">
      <div className="flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3">
        <Link
          href="/collection"
          className="font-cinzel font-black text-base shrink-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text text-transparent tracking-widest uppercase"
        >
          Realms of Eternity
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative text-sm px-4 py-2 transition-colors font-medium tracking-wide',
                  active ? 'text-amber-300' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                )}
              </Link>
            )
          })}
          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                'flex items-center gap-1 text-sm px-4 py-2 transition-colors font-medium tracking-wide',
                moreLinks.some((l) => pathname.startsWith(l.href)) ? 'text-amber-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              More <ChevronDown size={12} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute top-full left-0 z-50 mt-1 w-44 rounded-xl border border-white/10 bg-[#0d0d1a] shadow-2xl overflow-hidden">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'block px-4 py-2.5 text-sm transition-colors',
                        pathname.startsWith(link.href) ? 'text-amber-300 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'relative text-sm px-4 py-2 transition-colors font-medium tracking-wide',
                pathname.startsWith('/admin') ? 'text-amber-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="hidden md:block"><DailyQuests /></span>
          <NotificationBell />
          {loginStreak > 0 && (
            <span className="hidden md:flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 text-xs font-bold text-orange-400" title="Login streak">
              🔥 Day {loginStreak}
            </span>
          )}
          <Link
            href="/coins"
            className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
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
            className="hidden md:block p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
            aria-label="Settings"
          >
            <Settings size={16} />
          </Link>
          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </form>
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-purple-500/20 bg-[#080810]/95 px-4 py-3 space-y-1">
          {/* Streak + quests summary on mobile */}
          {loginStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 mb-1">
              <span className="text-sm font-bold text-orange-400">🔥 Day {loginStreak} streak</span>
            </div>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm transition-colors font-medium',
                pathname.startsWith(link.href)
                  ? 'text-amber-300 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          <div className="border-t border-white/10 pt-2 mt-1 space-y-1">
            {[
              { href: '/wishlist', label: '⭐ Wishlist' },
              { href: '/gift', label: '🎁 Gift a Card' },
              { href: '/craft', label: '🔨 Craft' },
              { href: '/redeem', label: '🎟️ Redeem' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Settings size={16} />
              Settings
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-4 py-2.5 h-auto font-normal text-slate-400">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
