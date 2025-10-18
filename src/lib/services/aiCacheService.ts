import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import crypto from 'crypto'
import type { Database } from '@/lib/supabase/types'

type AICacheInsert = Database['public']['Tables']['ai_cache']['Insert']

export class AICacheService {
  static hashPayload(input: unknown): string {
    const json = typeof input === 'string' ? input : JSON.stringify(input)
    return crypto.createHash('sha256').update(json).digest('hex')
  }

  static async get(model: string, payload: unknown): Promise<unknown | null> {
    try {
      if (!isSupabaseConfigured()) return null
      const messages_hash = this.hashPayload(payload)
      const key = `${model}:${messages_hash}`
      const { data, error } = await supabase
        .from('ai_cache')
        .select('response_json, expires_at')
        .eq('key', key)
        .limit(1)
        .maybeSingle()
      if (error || !data) return null
      if (new Date((data as unknown).expires_at) < new Date()) return null
      // response_json is already JSON, no need to parse
      return (data as unknown).response_json
    } catch {
      return null
    }
  }

  static async set(model: string, payload: unknown, response: unknown, ttlSeconds = 6 * 60 * 60): Promise<void> {
    try {
      if (!isSupabaseConfigured()) return
      const messages_hash = this.hashPayload(payload)
      const key = `${model}:${messages_hash}`
      const entry: AICacheInsert = {
        key,
        model,
        messages_hash,
        response_json: response, // Store as JSON directly
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString()
      }
      // Upsert
      await supabase.from('ai_cache').upsert(entry as never, { onConflict: 'key' })
    } catch {
      // swallow cache errors
    }
  }
}

