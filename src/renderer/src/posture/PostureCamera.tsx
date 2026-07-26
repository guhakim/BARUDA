import { useFaceLandmarker } from './useFaceLandmarker'
import { usePoseLandmarker } from './usePoseLandmarker'
import { usePostureScore } from './usePostureScore'
import { usePostureStreak } from './usePostureStreak'

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

function formatStreak(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const STREAK_RING_RADIUS = 30
const STREAK_RING_CIRCUMFERENCE = 2 * Math.PI * STREAK_RING_RADIUS

// One full lap of the ring per minute of sustained good posture — a small,
// satisfying loop instead of a bar that just fills up once and stalls.
function PointsCard({
  streakSeconds,
  totalPoints
}: {
  streakSeconds: number
  totalPoints: number
}): React.JSX.Element {
  const lapProgress = (streakSeconds % 60) / 60
  const offset = STREAK_RING_CIRCUMFERENCE * (1 - lapProgress)
  const active = streakSeconds > 0

  return (
    <section className="card points-card">
      <div className="points-row">
        <div className="streak-ring">
          <svg width={72} height={72}>
            <defs>
              <linearGradient id="streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2f9e6e" />
                <stop offset="100%" stopColor="#8a5bf5" />
              </linearGradient>
            </defs>
            <circle cx={36} cy={36} r={STREAK_RING_RADIUS} className="streak-ring-track" />
            <circle
              cx={36}
              cy={36}
              r={STREAK_RING_RADIUS}
              className={`streak-ring-fill ${active ? 'active' : ''}`}
              strokeDasharray={STREAK_RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="streak-ring-value">{formatStreak(streakSeconds)}</span>
        </div>

        <div className="points-total">
          <span className="points-total-value">{totalPoints.toLocaleString()}</span>
          <span className="points-total-label">✨ 포인트</span>
        </div>
      </div>
      <p className="hint">바른 자세를 유지할수록 포인트가 쌓여요</p>
    </section>
  )
}

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()
  const { angles } = usePoseLandmarker(videoRef)
  const { baseline, score, registerBaseline } = usePostureScore(landmarks, angles)
  const goodness = 100 - score
  const tracking = Boolean(baseline) && (Boolean(landmarks) || Boolean(angles))
  const isPerfect = tracking && goodness >= PERFECT_THRESHOLD
  const { streakSeconds, totalPoints } = usePostureStreak(goodness, tracking)
  const cameraBlocked = status === 'ready' && !landmarks && !angles

  return (
    <>
      <section className="card">
        <div className={`camera-frame ${isPerfect ? 'perfect' : ''}`}>
          <video ref={videoRef} muted playsInline />
          <GuideOutline goodness={tracking ? goodness : 0} perfect={isPerfect} />
          {cameraBlocked && <p className="camera-blocked-text">카메라가 닫혀 있습니다</p>}
          <span className={`dot ${status}`} />
        </div>

        <button
          type="button"
          className={`status-btn ${baseline ? 'status-btn-static' : ''}`}
          onClick={baseline ? undefined : registerBaseline}
          disabled={!baseline && !landmarks}
          title={baseline ? '현재 자세 상태' : '기준점 등록'}
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

      {tracking && <PointsCard streakSeconds={streakSeconds} totalPoints={totalPoints} />}
    </>
  )
}

export default PostureCamera
