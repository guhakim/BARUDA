import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { SubscriptionStatus } from './useSubscriptionStatus'

interface BillingPanelProps {
  session: Session
  status: SubscriptionStatus
  loading: boolean
}

function BillingPanel({ session, status, loading }: BillingPanelProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  async function startCheckout(): Promise<void> {
    setError(null)
    setRedirecting(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/billing/checkout-session`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!response.ok) throw new Error(await response.text())
      const { url } = (await response.json()) as { url: string }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRedirecting(false)
    }
  }

  if (loading) return <></>

  return (
    <div className="row" style={{ padding: '0 4px' }}>
      <span className={`badge ${status === 'active' ? 'active' : ''}`}>
        {status === 'active' ? '프리미엄' : '무료'}
      </span>
      {status !== 'active' && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={startCheckout}
          disabled={redirecting}
        >
          {redirecting ? '이동 중...' : '업그레이드'}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default BillingPanel
