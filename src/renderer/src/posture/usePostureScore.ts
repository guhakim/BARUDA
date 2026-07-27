import { useEffect, useRef, useState } from 'react'
import type { PostureLandmarks } from './useFaceLandmarker'
import type { PostureAngles } from './usePoseLandmarker'
import {
  clearBaseline,
  computePoseScore,
  computePostureScore,
  deriveMetrics,
  loadBaseline,
  saveBaseline,
  scoreToBlurPx,
  type PostureBaseline
} from './postureScore'

// Light smoothing so the blur doesn't flicker between samples, while still
// settling back to 0 within ~1s of returning to good posture (FR-03).
const SMOOTHING_ALPHA = 0.5

interface UsePostureScoreResult {
  baseline: PostureBaseline | null
  score: number
  blurPx: number
  blurDisabled: boolean
  toggleBlurDisabled: () => void
  registerBaseline: () => void
  resetBaseline: () => void
}

export function usePostureScore(
  landmarks: PostureLandmarks | null,
  angles: PostureAngles | null,
  sensitivity = 1
): UsePostureScoreResult {
  const [baseline, setBaseline] = useState<PostureBaseline | null>(() => loadBaseline())
  const [score, setScore] = useState(0)
  const [blurPx, setBlurPx] = useState(0)
  const [blurDisabled, setBlurDisabled] = useState(false)
  const smoothedScoreRef = useRef(0)
  const blurDisabledRef = useRef(blurDisabled)
  blurDisabledRef.current = blurDisabled

  useEffect(() => {
    if (!baseline || (!landmarks && !angles)) return

    // Both signals are scored relative to what was captured at baseline
    // registration (not absolute vertical), so camera placement/angle bias
    // cancels out the same way for pose angles as it already does for the
    // face-landmark ratios. Take whichever says posture is worse, so a
    // slouch the pose model catches isn't masked by a stale face reading.
    const faceScore = landmarks
      ? computePostureScore(deriveMetrics(landmarks), baseline, sensitivity)
      : 0
    const poseScore = angles ? computePoseScore(angles, baseline) : 0
    const rawScore = Math.max(faceScore, poseScore)

    smoothedScoreRef.current =
      smoothedScoreRef.current + (rawScore - smoothedScoreRef.current) * SMOOTHING_ALPHA
    const smoothed = Math.round(smoothedScoreRef.current)
    const nextBlurPx = scoreToBlurPx(smoothed)

    setScore(smoothed)
    setBlurPx(nextBlurPx)
    // Blur-disabled stays in effect until the person turns it back on
    // themselves — it shouldn't get overwritten by the next posture sample.
    window.electron.ipcRenderer.send('overlay:set-blur', blurDisabledRef.current ? 0 : nextBlurPx)
    window.electron.ipcRenderer.send('posture:report', { score: smoothed, timestamp: Date.now() })
  }, [landmarks, angles, baseline, sensitivity])

  // Lets someone who wants a clear screen right now (e.g. presenting,
  // showing someone else the screen) suppress the blur entirely instead of
  // it kicking in the moment their posture score says it should.
  function toggleBlurDisabled(): void {
    setBlurDisabled((prev) => {
      const next = !prev
      window.electron.ipcRenderer.send('overlay:set-blur', next ? 0 : blurPx)
      return next
    })
  }

  function registerBaseline(): void {
    if (!landmarks) return
    const next: PostureBaseline = {
      ...deriveMetrics(landmarks),
      ...(angles && { neckAngleDeg: angles.neckAngleDeg, trunkAngleDeg: angles.trunkAngleDeg })
    }
    saveBaseline(next)
    setBaseline(next)
    smoothedScoreRef.current = 0
    setScore(0)
    setBlurPx(0)
    setBlurDisabled(false)
    window.electron.ipcRenderer.send('overlay:set-blur', 0)
  }

  function resetBaseline(): void {
    clearBaseline()
    setBaseline(null)
    smoothedScoreRef.current = 0
    setScore(0)
    setBlurPx(0)
    setBlurDisabled(false)
    window.electron.ipcRenderer.send('overlay:set-blur', 0)
  }

  return {
    baseline,
    score,
    blurPx,
    blurDisabled,
    toggleBlurDisabled,
    registerBaseline,
    resetBaseline
  }
}
