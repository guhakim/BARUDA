import { useFaceLandmarker } from './useFaceLandmarker'
import { usePoseLandmarker } from './usePoseLandmarker'
import { usePostureScore } from './usePostureScore'

function statusEmoji(goodness: number): string {
  if (goodness >= 70) return '👍'
  if (goodness >= 40) return '😐'
  return '😣'
}

const RED: [number, number, number] = [224, 115, 107]
const YELLOW: [number, number, number] = [217, 180, 92]
const GREEN: [number, number, number] = [47, 158, 110]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Continuous red -> yellow -> green, instead of three flat bands, so the
// bar's color tracks smoothly with the score the same way its width does.
function goodnessColor(goodness: number): string {
  const [from, to, t] =
    goodness <= 50 ? [RED, YELLOW, goodness / 50] : [YELLOW, GREEN, (goodness - 50) / 50]
  const r = Math.round(lerp(from[0], to[0], t))
  const g = Math.round(lerp(from[1], to[1], t))
  const b = Math.round(lerp(from[2], to[2], t))
  return `rgb(${r}, ${g}, ${b})`
}

function HealthBar({ goodness }: { goodness: number }): React.JSX.Element {
  const color = goodnessColor(goodness)

  return (
    <div className="health-bar">
      <span className="health-label">자세</span>
      <div className="health-track">
        <div className="health-fill" style={{ width: `${goodness}%`, background: color }} />
      </div>
      <span className="health-value">{goodness}%</span>
    </div>
  )
}

const PERFECT_THRESHOLD = 95

function GuideOutline({
  goodness,
  perfect
}: {
  goodness: number
  perfect: boolean
}): React.JSX.Element {
  return (
    <svg
      className={`guide-outline ${perfect ? 'perfect' : ''}`}
      viewBox="0 0 300 225"
      preserveAspectRatio="none"
    >
      <path
        d="M55,225 C55,155 85,125 108,103 C90,75 100,20 150,20 C200,20 210,75 192,103 C215,125 245,155 245,225"
        fill="none"
        stroke={goodnessColor(goodness)}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  )
}

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()
  const { angles } = usePoseLandmarker(videoRef)
  const { baseline, score, registerBaseline } = usePostureScore(landmarks, angles)
  const goodness = 100 - score
  const tracking = Boolean(baseline) && (Boolean(landmarks) || Boolean(angles))
  const isPerfect = tracking && goodness >= PERFECT_THRESHOLD

  return (
    <section className="card">
      <div className={`camera-frame ${isPerfect ? 'perfect' : ''}`}>
        <video ref={videoRef} muted playsInline />
        <GuideOutline goodness={tracking ? goodness : 0} perfect={isPerfect} />
        <span className={`dot ${status}`} />
      </div>

      <button
        type="button"
        className="status-btn"
        onClick={registerBaseline}
        disabled={!landmarks}
        title={baseline ? '기준점 다시 등록' : '기준점 등록'}
      >
        {error ? '⚠️' : tracking ? statusEmoji(goodness) : '📍'}
      </button>

      {error ? (
        <p className="error-text">카메라를 사용할 수 없습니다</p>
      ) : tracking ? (
        <HealthBar goodness={goodness} />
      ) : (
        <p className="hint">바른 자세로 앉은 뒤 버튼을 눌러 등록하세요</p>
      )}
    </section>
  )
}

export default PostureCamera
