import { useFaceLandmarker } from './useFaceLandmarker'
import { usePoseLandmarker } from './usePoseLandmarker'
import { usePostureScore } from './usePostureScore'

function statusEmoji(goodness: number): string {
  if (goodness >= 70) return '👍'
  if (goodness >= 40) return '😐'
  return '😣'
}

function HealthBar({ goodness }: { goodness: number }): React.JSX.Element {
  const color = goodness >= 70 ? '#2f9e6e' : goodness >= 40 ? '#d9b45c' : '#e0736b'

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

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()
  const { angles } = usePoseLandmarker(videoRef)
  const { baseline, score, registerBaseline } = usePostureScore(landmarks, angles)
  const goodness = 100 - score
  const ready = landmarks || angles

  return (
    <section className="card">
      <div className="camera-frame">
        <video ref={videoRef} muted playsInline />
        <span className={`dot ${status}`} />
      </div>

      <button
        type="button"
        className="status-btn"
        onClick={registerBaseline}
        disabled={!landmarks}
        title={baseline ? '기준점 다시 등록' : '기준점 등록(선택)'}
      >
        {error ? '⚠️' : ready ? statusEmoji(goodness) : '📍'}
      </button>

      {error ? (
        <p className="error-text">카메라를 사용할 수 없습니다</p>
      ) : ready ? (
        <HealthBar goodness={goodness} />
      ) : (
        <p className="hint">자세를 인식하는 중이에요</p>
      )}
    </section>
  )
}

export default PostureCamera
