import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useSubscriptionStatus } from './useSubscriptionStatus'

interface BillingPanelProps {
  session: Session
}

function BillingPanel({ session }: BillingPanelProps): React.JSX.Element {
  const { status, loading } = useSubscriptionStatus(session)
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

  if (loading) return <p>구독 상태 확인 중...</p>

  return (
    <div style={{ marginTop: 24 }}>
      <h3>구독</h3>
      <p>현재 상태: {status}</p>
      {status !== 'active' && (
        <button type="button" onClick={startCheckout} disabled={redirecting}>
          {redirecting ? '이동 중...' : '프리미엄 구독하기'}
        </button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default BillingPanel
