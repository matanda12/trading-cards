import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Cinzel_Decorative } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const cinzelDecorative = Cinzel_Decorative({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '700', '900'] })

export const metadata: Metadata = {
  title: 'Realms of Eternity',
  description: 'Collect, trade, and sell unique fantasy trading cards.',
  appleWebApp: {
    capable: true,
    title: 'Realms of Eternity',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${cinzelDecorative.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
