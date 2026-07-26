import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// Landmark indices from the MediaPipe Face Mesh topology.
const NOSE_TIP = 1
const LEFT_EAR = 234
const RIGHT_EAR = 454

export interface PostureLandmarks {
  nose: { x: number; y: number; z: number }
  leftEar: { x: number; y: number; z: number }
  rightEar: { x: number; y: number; z: number }
}

interface UseFaceLandmarkerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: PostureLandmarks | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

export function useFaceLandmarker(): UseFaceLandmarkerResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [landmarks, setLandmarks] = useState<PostureLandmarks | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let stream: MediaStream | null = null
    let landmarker: FaceLandmarker | null = null

    async function setup(): Promise<void> {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1
        })

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        })

        if (cancelled || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        setStatus('ready')
        detectLoop()
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    // Runs at the FR-02 target cadence (~2-3Hz) rather than every frame,
    // to keep CPU usage inside the NFR-02 budget. Uses setTimeout instead
    // of requestAnimationFrame so tracking keeps running (posture score
    // and the mini bar's color) while the main window is hidden behind
    // the mini bar — rAF callbacks are paused entirely by Chromium once a
    // window isn't visible, which froze the mini bar at its last color.
    const DETECT_INTERVAL_MS = 350

    function detectLoop(): void {
      timeoutId = setTimeout(detectLoop, DETECT_INTERVAL_MS)
      if (cancelled || !landmarker || !videoRef.current) return

      const now = performance.now()
      if (videoRef.current.readyState < 2) return

      const result = landmarker.detectForVideo(videoRef.current, now)
      const face = result.faceLandmarks?.[0]
      if (!face) {
        setLandmarks(null)
        return
      }

      const nose = face[NOSE_TIP]
      const leftEar = face[LEFT_EAR]
      const rightEar = face[RIGHT_EAR]
      if (!nose || !leftEar || !rightEar) {
        setLandmarks(null)
        return
      }

      const next: PostureLandmarks = {
        nose: { x: nose.x, y: nose.y, z: nose.z },
        leftEar: { x: leftEar.x, y: leftEar.y, z: leftEar.z },
        rightEar: { x: rightEar.x, y: rightEar.y, z: rightEar.z }
      }
      setLandmarks(next)
      console.log('[posture] nose/ear landmarks', next)
    }

    setup()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      stream?.getTracks().forEach((track) => track.stop())
      landmarker?.close()
    }
  }, [])

  return { videoRef, landmarks, status, error }
}
