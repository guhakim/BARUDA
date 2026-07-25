import type { PostureLandmarks } from './useFaceLandmarker'
import type { PostureAngles } from './usePoseLandmarker'

export interface PostureBaseline {
  noseDropRatio: number
  forwardZRatio: number
  // Captured at registration time when Pose Landmarker was available.
  // Optional so baselines saved before pose tracking existed still load.
  neckAngleDeg?: number
  trunkAngleDeg?: number
}

const BASELINE_STORAGE_KEY = 'baruda:posture-baseline'

// Derives scale-invariant metrics from raw landmarks so posture scoring
// doesn't depend on how close the user sits to the camera.
export function deriveMetrics(
  landmarks: PostureLandmarks
): Pick<PostureBaseline, 'noseDropRatio' | 'forwardZRatio'> {
  const { nose, leftEar, rightEar } = landmarks
  const earMidY = (leftEar.y + rightEar.y) / 2
  const earMidZ = (leftEar.z + rightEar.z) / 2
  const earDistance = Math.hypot(leftEar.x - rightEar.x, leftEar.y - rightEar.y) || 1

  return {
    // How far the nose sits below the ear line, relative to head size.
    noseDropRatio: (nose.y - earMidY) / earDistance,
    // How far the nose pushes toward the camera relative to the ears,
    // relative to head size (forward head posture brings the nose closer).
    forwardZRatio: (earMidZ - nose.z) / earDistance
  }
}

export function loadBaseline(): PostureBaseline | null {
  const raw = localStorage.getItem(BASELINE_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PostureBaseline
  } catch {
    return null
  }
}

export function saveBaseline(baseline: PostureBaseline): void {
  localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline))
}

export function clearBaseline(): void {
  localStorage.removeItem(BASELINE_STORAGE_KEY)
}

const NOSE_DROP_WEIGHT = 2.5
const FORWARD_Z_WEIGHT = 4

// Turns the deviation from baseline into a 0-100 "turtle neck" score.
export function computePostureScore(
  current: Pick<PostureBaseline, 'noseDropRatio' | 'forwardZRatio'>,
  baseline: PostureBaseline,
  sensitivity = 1
): number {
  const noseDropDelta = Math.max(0, current.noseDropRatio - baseline.noseDropRatio)
  const forwardZDelta = Math.max(0, current.forwardZRatio - baseline.forwardZRatio)

  const raw = (noseDropDelta * NOSE_DROP_WEIGHT + forwardZDelta * FORWARD_Z_WEIGHT) * sensitivity
  return Math.round(Math.min(100, Math.max(0, raw * 100)))
}

export function scoreToBlurPx(score: number, maxBlurPx = 15): number {
  return Math.round((score / 100) * maxBlurPx)
}

// A webcam is rarely mounted exactly at eye level, so the neck/trunk angle
// vs. true vertical is biased by camera placement alone — even a perfect
// sitting posture might read as 30-40deg if the camera looks slightly up
// or down at the face. Scoring the *change* from the angles captured at
// baseline registration cancels that camera-specific bias out, the same
// way computePostureScore already does for the face-landmark metrics.
function angleDeltaToScore(deltaDeg: number, goodDeltaDeg: number, badDeltaDeg: number): number {
  const delta = Math.max(0, deltaDeg)
  if (delta <= goodDeltaDeg) return 0
  if (delta >= badDeltaDeg) return 100
  return ((delta - goodDeltaDeg) / (badDeltaDeg - goodDeltaDeg)) * 100
}

const NECK_GOOD_DELTA = 5
const NECK_BAD_DELTA = 30
const TRUNK_GOOD_DELTA = 5
const TRUNK_BAD_DELTA = 30

// Hip landmarks are frequently occluded/off-screen in a close head-and-
// shoulders webcam crop, so the trunk angle estimate is noisier than the
// neck angle. Weight it down instead of a flat average, so a noisy hip
// estimate can't tank an otherwise-good score on its own.
const NECK_WEIGHT = 0.75
const TRUNK_WEIGHT = 0.25

export function computePoseScore(current: PostureAngles, baseline: PostureBaseline): number {
  if (baseline.neckAngleDeg === undefined || baseline.trunkAngleDeg === undefined) return 0

  const neckScore = angleDeltaToScore(
    current.neckAngleDeg - baseline.neckAngleDeg,
    NECK_GOOD_DELTA,
    NECK_BAD_DELTA
  )
  const trunkScore = angleDeltaToScore(
    current.trunkAngleDeg - baseline.trunkAngleDeg,
    TRUNK_GOOD_DELTA,
    TRUNK_BAD_DELTA
  )
  return neckScore * NECK_WEIGHT + trunkScore * TRUNK_WEIGHT
}
