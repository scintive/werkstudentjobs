import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'

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
      return NextResponse.json({ tailoredJobs: [] })
    }

    // Use database function to bypass RLS
    const { data: variants, error } = await supabase
      .rpc('get_user_tailored_jobs', { p_user_id: userId })

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
