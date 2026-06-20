'use client'

import { useEffect, useState } from 'react'

type Quest = {
  id: string
  label: string
  emoji: string
  done: boolean
  progress: number
  total: number
}

export function DailyQuests() {
  const [quests, setQuests] = useState<Quest[] | null>(null)
  const [open, setOpen] = useState(false)
  const doneCount = quests?.filter((q) => q.done).length ?? 0

  useEffect(() => {
    fetch('/api/quests')
      .then((r) => r.json())
      .then((d) => setQuests(d.quests))
      .catch(() => {})
  }, [])

  if (!quests) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-1.5 text-xs font-bold text-green-400 hover:bg-green-500/20 transition-colors"
        title="Daily Quests"
      >
        <span>📋</span>
        <span className="hidden sm:inline">{doneCount}/{quests.length}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-white/10 bg-[#0d0d1a] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-semibold text-sm text-white">Daily Quests</span>
              <span className="text-xs text-slate-400">{doneCount}/{quests.length} done</span>
            </div>
            <div className="divide-y divide-white/5">
              {quests.map((q) => (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-lg shrink-0">{q.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${q.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{q.label}</p>
                    {!q.done && q.total > 1 && (
                      <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(q.progress / q.total) * 100}%` }} />
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-lg">{q.done ? '✅' : '○'}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-white/10">
              <p className="text-xs text-slate-500 text-center">Resets at midnight</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
