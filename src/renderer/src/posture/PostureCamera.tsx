import { useFaceLandmarker } from './useFaceLandmarker'
import { usePostureScore } from './usePostureScore'

const RING_RADIUS = 40
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ScoreRing({ score }: { score: number }): React.JSX.Element {
  const goodness = 100 - score
  const offset = RING_CIRCUMFERENCE * (1 - goodness / 100)
  const color = goodness >= 70 ? '#4f9d69' : goodness >= 40 ? '#d9b45c' : '#e0736b'

  return (
    <div className="score-ring">
      <svg width={96} height={96}>
        <circle
          cx={48}
          cy={48}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={48}
          cy={48}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 300ms ease-out, stroke 300ms ease-out' }}
        />
      </svg>
      <span className="value">{goodness}</span>
    </div>
  )
}

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()
  const { baseline, score, registerBaseline } = usePostureScore(landmarks)

  return (
    <section className="card">
      <div className="camera-frame">
        <video ref={videoRef} muted playsInline />
        <span className={`dot ${status}`} />
      </div>

      {error ? (
        <p className="error-text">카메라를 사용할 수 없습니다</p>
      ) : baseline ? (
        <ScoreRing score={score} />
      ) : (
        <p className="hint">바른 자세로 앉은 뒤 기준점을 등록하세요</p>
      )}

      <button
        type="button"
        className={baseline ? 'btn btn-ghost' : 'btn btn-primary'}
        onClick={registerBaseline}
        disabled={!landmarks}
      >
        {baseline ? '기준점 다시 등록' : '기준점 등록'}
      </button>
    </section>
  )
}

export default PostureCamera
