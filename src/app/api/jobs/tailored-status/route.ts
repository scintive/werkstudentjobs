import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase(request)
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_session')?.value

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
