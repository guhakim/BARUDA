import { useEffect, useRef, useState } from 'react'

const TOTAL_POINTS_KEY = 'baruda:total-points'
const GOOD_THRESHOLD = 85
const POINTS_PER_SECOND = 1

function loadTotalPoints(): number {
  const raw = localStorage.getItem(TOTAL_POINTS_KEY)
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

// Rewards sustained good posture rather than an instantaneous score: every
// second the (smoothed) goodness stays at/above GOOD_THRESHOLD, the streak
// timer and the running point total both tick up. Dropping below the
// threshold resets the streak, but never claws back points already earned.
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
      setStreakSeconds((s) => s + 1)
      setTotalPoints((p) => {
        const next = p + POINTS_PER_SECOND
        localStorage.setItem(TOTAL_POINTS_KEY, String(next))
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { streakSeconds, totalPoints }
}
