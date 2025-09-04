import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Admin endpoint to apply database migrations
 * POST - Apply specific migration or all pending migrations
 */

export async function POST(request: NextRequest) {
  try {
    const { migration } = await request.json()
    
    if (migration === 'job_analysis_cache') {
      console.log('🗂️ ADMIN: Applying job analysis cache migration...')
      
      const migrationPath = join(process.cwd(), 'supabase_migrations', '05_create_job_analysis_cache.sql')
      const migrationSQL = await readFile(migrationPath, 'utf-8')
      
      // Execute the migration SQL
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
      
      if (error) {
        console.error('Migration error:', error)
        return NextResponse.json(
          { error: 'Migration failed', details: error.message },
          { status: 500 }
        )
      }

      console.log('🗂️ ADMIN: Job analysis cache migration completed')
      return NextResponse.json({
        success: true,
        message: 'Job analysis cache table created successfully'
      })
    }

    return NextResponse.json(
      { error: 'Unknown migration requested' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Admin migration error:', error)
    return NextResponse.json(
      { error: 'Migration operation failed' },
      { status: 500 }
    )
  }
}