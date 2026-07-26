import { useEffect, useRef, useState } from 'react'

const RED: [number, number, number] = [224, 115, 107]
const YELLOW: [number, number, number] = [217, 180, 92]
const GREEN: [number, number, number] = [47, 158, 110]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Mirrors PostureCamera.tsx's goodnessColor exactly, so the mini bar's
// color matches the main screen's "자세" bar at any given score.
function goodnessColor(goodness: number): string {
  const [from, to, t] =
    goodness <= 50 ? [RED, YELLOW, goodness / 50] : [YELLOW, GREEN, (goodness - 50) / 50]
  const r = Math.round(lerp(from[0], to[0], t))
  const g = Math.round(lerp(from[1], to[1], t))
  const b = Math.round(lerp(from[2], to[2], t))
  return `rgb(${r}, ${g}, ${b})`
}

// Dragging is done by hand (tracking mousedown/mousemove/mouseup and
// calling minibarAPI.moveBy) instead of BrowserWindow's native `movable` +
// -webkit-app-region: drag. That combo turned out to make the main window
// silently fail to show on launch on macOS, so the window itself stays
// non-movable and this reimplements the drag in JS.
const CLICK_MOVE_THRESHOLD_PX = 4

function MiniBarApp(): React.JSX.Element {
  const [goodness, setGoodness] = useState(100)
  const dragState = useRef<{ lastX: number; lastY: number; totalMove: number } | null>(null)

  useEffect(() => {
    window.minibarAPI.onGoodness(setGoodness)
  }, [])

  useEffect(() => {
    function onMouseMove(e: MouseEvent): void {
      const state = dragState.current
      if (!state) return
      const dx = e.screenX - state.lastX
      const dy = e.screenY - state.lastY
      state.lastX = e.screenX
      state.lastY = e.screenY
      state.totalMove += Math.hypot(dx, dy)
      window.minibarAPI.moveBy(dx, dy)
    }

    function onMouseUp(): void {
      const state = dragState.current
      dragState.current = null
      if (state && state.totalMove < CLICK_MOVE_THRESHOLD_PX) {
        window.minibarAPI.restore()
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function handleMouseDown(e: React.MouseEvent): void {
    dragState.current = { lastX: e.screenX, lastY: e.screenY, totalMove: 0 }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      title="드래그해서 이동, 클릭하면 BARUDA 창으로 돌아갑니다"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '8px 16px',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          borderRadius: 999,
          padding: '0 24px',
          background: goodnessColor(goodness),
          transition: 'background 200ms ease-out',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 15,
          fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif'
        }}
      >
        <span>자세</span>
        <span>{goodness}%</span>
      </div>
    </div>
  )
}

export default MiniBarApp
