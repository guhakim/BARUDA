import { useEffect, useRef, useState } from 'react'

const TOTAL_POINTS_KEY = 'baruda:total-points'
const GOOD_THRESHOLD = 85
const SECONDS_PER_POINT = 30

function loadTotalPoints(): number {
  const raw = localStorage.getItem(TOTAL_POINTS_KEY)
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

// Rewards sustained good posture rather than an instantaneous score: every
// second the (smoothed) goodness stays at/above GOOD_THRESHOLD, the streak
// timer ticks up, and every SECONDS_PER_POINT of unbroken streak earns one
// point. Dropping below the threshold resets the streak, but never claws
// back points already earned.
export function usePostureStreak(
  goodness: number,
  tracking: boolean
): { streakSeconds: number; totalPoints: number } {
  const [streakSeconds, setStreakSeconds] = useState(0)
  const [totalPoints, setTotalPoints] = useState(() => loadTotalPoints())
  const goodnessRef = useRef(goodness)
  const trackingRef = useRef(tracking)

  useEffect(() => {
    goodnessRef.current = goodness
    trackingRef.current = tracking
  }, [goodness, tracking])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!trackingRef.current || goodnessRef.current < GOOD_THRESHOLD) {
        setStreakSeconds(0)
        return
      }
      setStreakSeconds((s) => {
        const next = s + 1
        if (next % SECONDS_PER_POINT === 0) {
          setTotalPoints((p) => {
            const nextPoints = p + 1
            localStorage.setItem(TOTAL_POINTS_KEY, String(nextPoints))
            return nextPoints
          })
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { streakSeconds, totalPoints }
}
