import PostureCamera from './posture/PostureCamera'
import Dashboard from './dashboard/Dashboard'

// Auth + billing (see auth/, billing/) are wired up but not shown yet —
// signup and subscription are deferred, so the dashboard renders unlocked.
function App(): React.JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <h1>BARUDA</h1>
        <p>바른 자세를 자연스럽게</p>
      </header>
      <PostureCamera />
      <Dashboard />
    </div>
  )
}

export default App
