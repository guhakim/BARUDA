import { useFaceLandmarker } from './useFaceLandmarker'
import { usePostureScore } from './usePostureScore'

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()
  const { baseline, score, blurPx, registerBaseline, resetBaseline } = usePostureScore(landmarks)

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Posture tracking (MediaPipe Face Landmarker)</h3>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: 240, height: 180, transform: 'scaleX(-1)', background: '#000' }}
      />
      <p>Status: {status}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={registerBaseline} disabled={!landmarks}>
          바른 자세 기준점 등록
        </button>
        {baseline && (
          <button type="button" onClick={resetBaseline} style={{ marginLeft: 8 }}>
            기준점 초기화
          </button>
        )}
      </div>

      {baseline ? (
        <p>
          거북목 점수: {score} / 100 (blur {blurPx}px)
        </p>
      ) : (
        <p>기준점이 없습니다. 바른 자세로 앉은 뒤 기준점을 등록하세요.</p>
      )}
    </div>
  )
}

export default PostureCamera
