import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * Admin endpoint to create the ai_cache table
 * POST - Create ai_cache table for strategy caching
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🗂️ ADMIN: Creating ai_cache table for strategy caching...')

    // First check if table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_cache')

    if (tables && tables.length > 0) {
      console.log('🗂️ ADMIN: ai_cache table already exists')
      return NextResponse.json({
        success: true,
        message: 'ai_cache table already exists'
      })
    }

    // Create the table using direct SQL execution
    // We'll use a simple approach by inserting and then checking if it worked
    try {
      // Try to insert a test record to see if table exists
      const { error: testError } = await supabase
        .from('ai_cache')
        .insert({
          cache_key: '__test__',
          response_data: { test: true },
          expires_at: new Date().toISOString(),
          hit_count: 1
        })

      if (!testError) {
        // Table exists, delete test record
        await supabase
          .from('ai_cache')
          .delete()
          .eq('cache_key', '__test__')
        
        console.log('🗂️ ADMIN: ai_cache table already exists and is working')
        return NextResponse.json({
          success: true,
          message: 'ai_cache table already exists and is functional'
        })
      }
    } catch (tableCheckError) {
      console.log('🗂️ ADMIN: Table does not exist, will create manually')
    }

    // If we get here, table doesn't exist or isn't working
    // Return instructions for manual creation
    const createTableSQL = `
-- Create AI cache table for caching expensive AI responses
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_cache(expires_at);

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later)
DROP POLICY IF EXISTS ai_cache_all ON public.ai_cache;
CREATE POLICY ai_cache_all ON public.ai_cache FOR ALL USING (true) WITH CHECK (true);
`

    console.log('🗂️ ADMIN: Please run this SQL in Supabase dashboard:')
    console.log(createTableSQL)

    return NextResponse.json({
      success: false,
      message: 'Please create the ai_cache table manually in Supabase',
      sql: createTableSQL
    })

  } catch (error) {
    console.error('🗂️ ADMIN: Error creating ai_cache table:', error)
    return NextResponse.json(
      { error: 'Failed to create ai_cache table' },
      { status: 500 }
    )
  }
}