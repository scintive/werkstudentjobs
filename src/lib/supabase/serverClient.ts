import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createServerSupabase(req: NextRequest) {
  // Accept either Authorization: Bearer <jwt> or x-supabase-auth headers
  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader
    : (req.headers.get('x-supabase-auth') ? `Bearer ${req.headers.get('x-supabase-auth')}` : '')

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: bearer ? { Authorization: bearer } : {}
    },
    auth: {
      persistSession: false
    }
  })
  return client
}