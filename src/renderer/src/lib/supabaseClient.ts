import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are not set — auth and subscription status will not work until backend/.env and .env are configured.'
  )
}

// createClient() validates its URL argument and throws synchronously if
// it's empty, which would crash the whole renderer bundle before React
// even mounts. Fall back to a syntactically valid placeholder so the rest
// of the app (posture tracking, etc.) still works when Supabase isn't
// configured yet — auth calls will simply fail until real values are set.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
