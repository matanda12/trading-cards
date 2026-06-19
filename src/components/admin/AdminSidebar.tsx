'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, Package, Users, Key, ShoppingBag, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/cards', label: 'Cards', icon: CreditCard },
  { href: '/admin/packs', label: 'Packs', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/codes', label: 'Codes', icon: Key },
  { href: '/admin/listings', label: 'Listings', icon: ShoppingBag },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-border/50 bg-card/60 backdrop-blur-sm min-h-screen flex flex-col">
      <div className="p-5 border-b border-border/50">
        <p className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight uppercase">
          Admin Panel
        </p>
      </div>
      <nav className="p-2 space-y-0.5 flex-1">
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
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
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
        >
          <ChevronLeft size={16} className="shrink-0" />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
