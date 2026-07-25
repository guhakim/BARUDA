import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are not set — auth and subscription status will not work until backend/.env and .env are configured.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
