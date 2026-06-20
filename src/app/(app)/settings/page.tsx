import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const user = await requireAuth()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, username: true },
  })

  return (
    <div className="max-w-md space-y-8 py-8">
      <div>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-1">✦ Account</p>
        <h1 className="font-cinzel text-3xl font-black tracking-wide text-white">Settings</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-200">Profile</h2>
        <SettingsForm initialName={dbUser?.name ?? ''} initialUsername={dbUser?.username ?? ''} email={dbUser?.email ?? ''} />
      </div>
    </div>
  )
}
