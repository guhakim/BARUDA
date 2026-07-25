import { useState } from 'react'
import PostureCamera from './posture/PostureCamera'
import Dashboard from './dashboard/Dashboard'

// Auth + billing (see auth/, billing/) are wired up but not shown yet —
// signup and subscription are deferred, so the dashboard renders unlocked.
function App(): React.JSX.Element {
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="app">
      <header className="app-header row">
        <div />
        <div>
          <h1>BARUDA</h1>
          <p>바른 자세를 자연스럽게</p>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowStats((v) => !v)}
          aria-label="자세 데이터 보기"
        >
          ☰
        </button>
      </header>
      <PostureCamera />
      {showStats && <Dashboard />}
    </div>
  )
}

export default App
