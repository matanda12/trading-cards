'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, Package, Users, Key, ShoppingBag, ChevronLeft, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/cards', label: 'Cards', icon: CreditCard },
  { href: '/admin/packs', label: 'Packs', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/codes', label: 'Codes', icon: Key },
  { href: '/admin/listings', label: 'Listings', icon: ShoppingBag },
]

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="p-2 space-y-0.5 flex-1">
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'pl-[10px] border-l-2 border-primary bg-primary/10 text-foreground font-semibold'
                  : 'px-3 text-muted-foreground hover:text-foreground hover:bg-accent/30'
              )}
            >
              <Icon size={16} className="shrink-0" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border/50">
        <Link
          href="/collection"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
        >
          <ChevronLeft size={16} className="shrink-0" />
          Back to App
        </Link>
      </div>
    </>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border/50 bg-card/60 backdrop-blur-sm min-h-screen flex-col">
        <div className="p-5 border-b border-border/50">
          <p className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight uppercase">
            Admin Panel
          </p>
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-card/90 backdrop-blur-md border-b border-border/50">
        <p className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight uppercase">
          Admin Panel
        </p>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border/50 flex flex-col h-full">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <p className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight uppercase">
                Admin Panel
              </p>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
