import { useFaceLandmarker } from './useFaceLandmarker'

function PostureCamera(): React.JSX.Element {
  const { videoRef, landmarks, status, error } = useFaceLandmarker()

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
      {landmarks && <pre style={{ fontSize: 12 }}>{JSON.stringify(landmarks, null, 2)}</pre>}
    </div>
  )
}

export default PostureCamera
