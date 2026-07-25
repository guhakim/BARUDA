import type { PostureLandmarks } from './useFaceLandmarker'

export interface PostureBaseline {
  noseDropRatio: number
  forwardZRatio: number
}

const BASELINE_STORAGE_KEY = 'baruda:posture-baseline'

// Derives scale-invariant metrics from raw landmarks so posture scoring
// doesn't depend on how close the user sits to the camera.
export function deriveMetrics(landmarks: PostureLandmarks): PostureBaseline {
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
  current: PostureBaseline,
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

// Simplified RULA/REBA-style neck/trunk flexion bands (angle vs. vertical,
// in degrees) mapped onto the same 0-100 scale as the calibration-based
// score. Unlike computePostureScore, this needs no personal baseline —
// it works off absolute posture angles from MediaPipe Pose Landmarker.
function angleBandScore(angleDeg: number, bands: [number, number][]): number {
  for (const [maxAngle, score] of bands) {
    if (angleDeg <= maxAngle) return score
  }
  return 100
}

const NECK_BANDS: [number, number][] = [
  [10, 0],
  [20, 35],
  [35, 65]
]
const TRUNK_BANDS: [number, number][] = [
  [10, 0],
  [20, 35],
  [40, 65]
]

export function computeAbsolutePostureScore(neckAngleDeg: number, trunkAngleDeg: number): number {
  return Math.max(
    angleBandScore(neckAngleDeg, NECK_BANDS),
    angleBandScore(trunkAngleDeg, TRUNK_BANDS)
  )
}
