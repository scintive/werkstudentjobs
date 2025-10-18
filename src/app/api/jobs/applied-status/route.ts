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
      console.log('Applied status: auth.getUser() failed:', e)
    }

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
    const userProfileObj = userProfile as Record<string, unknown>;
    const { data: interactions, error } = await supabase
      .from('user_job_interactions')
      .select('job_id, created_at, interaction_data')
      .eq('user_profile_id', userProfileObj.id as string)
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
