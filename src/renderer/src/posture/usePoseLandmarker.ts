import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// BlazePose landmark indices used for RULA/REBA-style absolute angles.
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const LEFT_HIP = 23
const RIGHT_HIP = 24
const LEFT_EAR = 7
const RIGHT_EAR = 8

export interface PostureAngles {
  /** Neck flexion vs. vertical, in degrees. 0 = ear directly above shoulder. */
  neckAngleDeg: number
  /** Trunk flexion vs. vertical, in degrees. 0 = shoulder directly above hip. */
  trunkAngleDeg: number
}

// atan2-based angle between a 2D vector and the "straight up" vertical,
// in image coordinates (y grows downward).
function angleFromVertical(dx: number, dy: number): number {
  return (Math.atan2(Math.abs(dx), -dy) * 180) / Math.PI
}

export function usePoseLandmarker(videoRef: React.RefObject<HTMLVideoElement | null>): {
  angles: PostureAngles | null
} {
  const [angles, setAngles] = useState<PostureAngles | null>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const DETECT_INTERVAL_MS = 350

    async function setup(): Promise<void> {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        detectLoop()
      } catch {
        // Pose tracking is a supplementary signal — if it fails to load,
        // the calibration-based face score still drives the app.
      }
    }

    function detectLoop(): void {
      timeoutId = setTimeout(detectLoop, DETECT_INTERVAL_MS)
      const landmarker = landmarkerRef.current
      if (cancelled || !landmarker || !videoRef.current) return

      const now = performance.now()
      if (videoRef.current.readyState < 2) return

      const result = landmarker.detectForVideo(videoRef.current, now)
      const pose = result.landmarks?.[0]
      if (!pose) {
        setAngles(null)
        return
      }

      const leftShoulder = pose[LEFT_SHOULDER]
      const rightShoulder = pose[RIGHT_SHOULDER]
      const leftHip = pose[LEFT_HIP]
      const rightHip = pose[RIGHT_HIP]
      const leftEar = pose[LEFT_EAR]
      const rightEar = pose[RIGHT_EAR]
      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftEar || !rightEar) {
        setAngles(null)
        return
      }

      const shoulderMid = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      }
      const hipMid = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 }
      const earMid = { x: (leftEar.x + rightEar.x) / 2, y: (leftEar.y + rightEar.y) / 2 }

      const neckAngleDeg = angleFromVertical(earMid.x - shoulderMid.x, earMid.y - shoulderMid.y)
      const trunkAngleDeg = angleFromVertical(shoulderMid.x - hipMid.x, shoulderMid.y - hipMid.y)

      setAngles({ neckAngleDeg, trunkAngleDeg })
    }

    setup()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [videoRef])

  return { angles }
}
