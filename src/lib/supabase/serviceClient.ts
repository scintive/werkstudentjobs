import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-only client with service role for privileged writes (bypasses RLS).
// Never import this in client bundles.
export function createServiceSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE service configuration')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

