import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import PostureCamera from './posture/PostureCamera'
import AuthGate from './auth/AuthGate'
import BillingPanel from './billing/BillingPanel'
import Dashboard from './dashboard/Dashboard'
import { useSubscriptionStatus } from './billing/useSubscriptionStatus'
import type { Session } from '@supabase/supabase-js'

function AuthenticatedApp({ session }: { session: Session }): React.JSX.Element {
  const { status, loading } = useSubscriptionStatus(session)

  return (
    <>
      <PostureCamera />
      <BillingPanel session={session} status={status} loading={loading} />
      <Dashboard subscriptionStatus={status} />
    </>
  )
}

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <AuthGate>{(session) => <AuthenticatedApp session={session} />}</AuthGate>
      <Versions></Versions>
    </>
  )
}

export default App
