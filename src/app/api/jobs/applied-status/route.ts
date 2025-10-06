import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase(request)
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_session')?.value

    if (!userId) {
      return NextResponse.json({ appliedJobs: [] })
    }

    // Get user profile to get user_profile_id
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (!userProfile) {
      return NextResponse.json({ appliedJobs: [] })
    }

    // Query user_job_interactions to find applied jobs
    const { data: interactions, error } = await supabase
      .from('user_job_interactions')
      .select('job_id, created_at, interaction_data')
      .eq('user_profile_id', userProfile.id)
      .eq('interaction_type', 'apply')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applied jobs:', error)
      return NextResponse.json({ appliedJobs: [] })
    }

    return NextResponse.json({
      success: true,
      appliedJobs: interactions || [],
      count: interactions?.length || 0
    })

  } catch (error) {
    console.error('Error in applied-status API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applied jobs' },
      { status: 500 }
    )
  }
}
