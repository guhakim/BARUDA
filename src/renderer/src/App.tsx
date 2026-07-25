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
      <Dashboard subscriptionStatus={status} />
      <BillingPanel session={session} status={status} loading={loading} />
    </>
  )
}

function App(): React.JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <h1>BARUDA</h1>
        <p>바른 자세를 자연스럽게</p>
      </header>
      <AuthGate>{(session) => <AuthenticatedApp session={session} />}</AuthGate>
    </div>
  )
}

export default App
