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
  // Plain mutable counters, not React state read inside the interval — a
  // functional setState updater can run twice under StrictMode (React
  // deliberately double-invokes it to check for impure updaters), and the
  // localStorage write nested inside the previous version fired every
  // time that happened, awarding two points instead of one.
  const streakRef = useRef(0)
  const totalPointsRef = useRef(totalPoints)

  useEffect(() => {
    goodnessRef.current = goodness
    trackingRef.current = tracking
  }, [goodness, tracking])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!trackingRef.current || goodnessRef.current < GOOD_THRESHOLD) {
        streakRef.current = 0
        setStreakSeconds(0)
        return
      }

      streakRef.current += 1
      setStreakSeconds(streakRef.current)

      if (streakRef.current % SECONDS_PER_POINT === 0) {
        totalPointsRef.current += 1
        localStorage.setItem(TOTAL_POINTS_KEY, String(totalPointsRef.current))
        setTotalPoints(totalPointsRef.current)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { streakSeconds, totalPoints }
}
