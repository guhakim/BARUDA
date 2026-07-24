import { useEffect, useState } from 'react'

function OverlayApp(): React.JSX.Element {
  const [blur, setBlur] = useState(0)

  useEffect(() => {
    window.overlayAPI.onBlurChange(setBlur)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        transition: 'backdrop-filter 200ms ease-out, -webkit-backdrop-filter 200ms ease-out'
      }}
    />
  )
}

export default OverlayApp
