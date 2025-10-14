import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase(request)

    // SECURITY FIX: Only use Supabase auth
    let userId: string | null = null
    try {
      const { data: authRes } = await supabase.auth.getUser()
      if (authRes?.user) {
        userId = authRes.user.id
      }
    } catch (e) {
      console.log('Tailored status: auth.getUser() failed:', e)
    }

    if (!userId) {
      console.log('✨ TAILORED STATUS API: No userId, returning empty array')
      return NextResponse.json({ tailoredJobs: [] })
    }

    // Use service role key to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Query resume_variants directly for active tailored jobs
    const { data: variants, error } = await serviceClient
      .from('resume_variants')
      .select('id, job_id, match_score, created_at, updated_at, variant_name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    console.log('✨ TAILORED STATUS API: userId:', userId, 'variants count:', variants?.length, 'error:', error)

    if (variants && variants.length > 0) {
      console.log('✨ TAILORED STATUS API: First 3 job IDs:', variants.slice(0, 3).map(v => v.job_id))
    }

    if (error) {
      console.error('Error fetching tailored jobs:', error)
      return NextResponse.json({ tailoredJobs: [] })
    }

    return NextResponse.json({
      success: true,
      tailoredJobs: variants || [],
      count: variants?.length || 0
    })

  } catch (error) {
    console.error('Error in tailored-status API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tailored jobs' },
      { status: 500 }
    )
  }
}
