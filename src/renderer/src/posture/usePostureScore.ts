import { useEffect, useRef, useState } from 'react'
import type { PostureLandmarks } from './useFaceLandmarker'
import type { PostureAngles } from './usePoseLandmarker'
import {
  clearBaseline,
  computeAbsolutePostureScore,
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
  const smoothedScoreRef = useRef(0)

  useEffect(() => {
    if (!landmarks && !angles) return

    // The calibration-based score (relative to the user's own registered
    // baseline) and the RULA/REBA-style absolute-angle score are two
    // independent signals — take whichever says posture is worse, so a
    // missing/late baseline never masks a real slouch the pose model caught.
    const calibratedScore =
      landmarks && baseline
        ? computePostureScore(deriveMetrics(landmarks), baseline, sensitivity)
        : 0
    const absoluteScore = angles
      ? computeAbsolutePostureScore(angles.neckAngleDeg, angles.trunkAngleDeg)
      : 0
    const rawScore = Math.max(calibratedScore, absoluteScore)

    smoothedScoreRef.current =
      smoothedScoreRef.current + (rawScore - smoothedScoreRef.current) * SMOOTHING_ALPHA
    const smoothed = Math.round(smoothedScoreRef.current)
    const nextBlurPx = scoreToBlurPx(smoothed)

    setScore(smoothed)
    setBlurPx(nextBlurPx)
    window.electron.ipcRenderer.send('overlay:set-blur', nextBlurPx)
    window.electron.ipcRenderer.send('posture:report', { score: smoothed, timestamp: Date.now() })
  }, [landmarks, angles, baseline, sensitivity])

  function registerBaseline(): void {
    if (!landmarks) return
    const next = deriveMetrics(landmarks)
    saveBaseline(next)
    setBaseline(next)
    smoothedScoreRef.current = 0
    setScore(0)
    setBlurPx(0)
    window.electron.ipcRenderer.send('overlay:set-blur', 0)
  }

  function resetBaseline(): void {
    clearBaseline()
    setBaseline(null)
    smoothedScoreRef.current = 0
    setScore(0)
    setBlurPx(0)
    window.electron.ipcRenderer.send('overlay:set-blur', 0)
  }

  return { baseline, score, blurPx, registerBaseline, resetBaseline }
}
