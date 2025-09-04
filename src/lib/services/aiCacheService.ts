import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import crypto from 'crypto'

interface CacheEntry {
  key: string
  model: string
  messages_hash: string
  response_json: string
  expires_at: string
  created_at?: string
}

export class AICacheService {
  static hashPayload(input: any): string {
    const json = typeof input === 'string' ? input : JSON.stringify(input)
    return crypto.createHash('sha256').update(json).digest('hex')
  }

  static async get(model: string, payload: any): Promise<any | null> {
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
      if (new Date(data.expires_at) < new Date()) return null
      try {
        return JSON.parse(data.response_json)
      } catch {
        return null
      }
    } catch {
      return null
    }
  }

  static async set(model: string, payload: any, response: any, ttlSeconds = 6 * 60 * 60): Promise<void> {
    try {
      if (!isSupabaseConfigured()) return
      const messages_hash = this.hashPayload(payload)
      const key = `${model}:${messages_hash}`
      const entry: CacheEntry = {
        key,
        model,
        messages_hash,
        response_json: JSON.stringify(response),
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString()
      }
      // Upsert
      await supabase.from('ai_cache').upsert(entry, { onConflict: 'key' })
    } catch {
      // swallow cache errors
    }
  }
}

