'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72
const RESISTANCE = 2.5

export function PullToRefresh() {
  const router = useRouter()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY !== 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current || refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) { setPullY(0); return }
      if (window.scrollY === 0 && delta > 0) e.preventDefault()
      setPullY(Math.min(delta / RESISTANCE, THRESHOLD * 1.3))
    }

    function onTouchEnd() {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setPullY(THRESHOLD)
        router.refresh()
        setTimeout(() => {
          setRefreshing(false)
          setPullY(0)
        }, 1200)
      } else {
        setPullY(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY, refreshing, router])

  if (pullY === 0 && !refreshing) return null

  const progress = Math.min(pullY / THRESHOLD, 1)
  const ready = pullY >= THRESHOLD
  // Arrow rotates 0° → 180° as you pull (down arrow → up arrow = "let go")
  const arrowRotation = progress * 180

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullY - 48}px)`, transition: pulling.current ? 'none' : 'transform 0.3s ease' }}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition-all duration-200 ${
        ready || refreshing
          ? 'bg-amber-500/20 border-amber-400/60'
          : 'bg-black/50 border-white/15'
      }`}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {refreshing ? (
          /* Spinning circular refresh arrow */
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke={ready ? '#fbbf24' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          /* Down arrow that rotates as you pull */
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ready ? '#fbbf24' : '#94a3b8'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `rotate(${arrowRotation}deg)`, transition: pulling.current ? 'none' : 'transform 0.2s' }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        )}
      </div>
    </div>
  )
}
