import { useEffect, useState } from 'react'

function OverlayApp(): React.JSX.Element {
  const [blur, setBlur] = useState(0)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  useEffect(() => {
    window.overlayAPI.onBlurChange(setBlur)
    window.overlayAPI.onSnapshot(setSnapshot)
  }, [])

  const visible = blur > 0 && snapshot !== null

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {snapshot && (
        // Oversized + inset -5% so the blur radius never reveals a sharp edge
        // where the image ends, and object-fit keeps it filling the window
        // regardless of thumbnail aspect ratio drift.
        <img
          src={snapshot}
          style={{
            position: 'absolute',
            inset: '-5%',
            width: '110%',
            height: '110%',
            objectFit: 'cover',
            filter: `blur(${blur}px)`,
            opacity: visible ? 1 : 0,
            transition: 'filter 200ms ease-out, opacity 200ms ease-out'
          }}
        />
      )}
    </div>
  )
}

export default OverlayApp
