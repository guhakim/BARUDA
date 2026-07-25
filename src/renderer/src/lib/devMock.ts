// Shared flag for the local-only dev mock (see auth/AuthGate.tsx): lets the
// whole app run without a real Supabase/Stripe account. Only ever true in
// dev builds, and only when explicitly opted into via VITE_MOCK_AUTH.
export const MOCK_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true'
