import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { MOCK_AUTH_ENABLED } from '../lib/devMock'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'none'

interface FetchedStatus {
  session: Session | null
  status: SubscriptionStatus
}

// Reads the caller's own subscriptions row directly — RLS (see
// backend/supabase/migrations/0001_init.sql) guarantees this can never
// return another user's row, so no backend round-trip is needed just to
// check status.
export function useSubscriptionStatus(session: Session | null): {
  status: SubscriptionStatus
  loading: boolean
} {
  const [fetched, setFetched] = useState<FetchedStatus>({ session: null, status: 'none' })

  useEffect(() => {
    if (!session || MOCK_AUTH_ENABLED) return
    let cancelled = false

    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setFetched({ session, status: (data?.status as SubscriptionStatus) ?? 'none' })
      })

    return () => {
      cancelled = true
    }
  }, [session])

  if (!session) return { status: 'none', loading: false }
  if (MOCK_AUTH_ENABLED) return { status: 'active', loading: false }
  return {
    status: fetched.session === session ? fetched.status : 'none',
    loading: fetched.session !== session
  }
}
