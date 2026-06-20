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
      // Prevent the browser's native overscroll while we handle it
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

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullY - 44}px)`, transition: pulling.current ? 'none' : 'transform 0.3s ease' }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-colors duration-200 ${
        ready || refreshing
          ? 'bg-amber-500 border-amber-400'
          : 'bg-[#0d0a18] border-purple-500/40'
      }`}>
        {refreshing ? (
          <svg className="w-5 h-5 text-black animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10z" />
          </svg>
        ) : (
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${ready ? 'text-black' : 'text-purple-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ transform: `rotate(${progress * 180}deg)`, transition: pulling.current ? 'none' : 'transform 0.2s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>
    </div>
  )
}
