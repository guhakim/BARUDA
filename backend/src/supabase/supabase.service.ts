import { Injectable } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Wraps the service-role client. Only ever used server-side — this key
// must never reach the Electron renderer or preload bundle.
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient

  constructor() {
    const url = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    }
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false }
    })
  }
}
