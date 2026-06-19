import { requireAdmin } from '@/lib/session'
import Link from 'next/link'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/cards', label: 'Cards' },
  { href: '/admin/codes', label: 'Codes' },
  { href: '/admin/packs', label: 'Packs' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/listings', label: 'Listings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r bg-muted/30 shrink-0">
        <div className="p-4 font-bold border-b">Admin Panel</div>
        <nav className="p-2 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/collection" className="block px-3 py-2 rounded text-sm text-muted-foreground hover:bg-muted transition-colors mt-4">
            ← Back to App
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
