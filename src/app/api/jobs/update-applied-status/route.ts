import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase(request)
    const cookieStore = await cookies()

    const body = await request.json()
    const { job_id, applied } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      )
    }

    const userId = cookieStore.get('user_session')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to get user_profile_id
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (applied) {
      // Add interaction record
      const { error: insertError } = await supabase
        .from('user_job_interactions')
        .insert({
          user_profile_id: userProfile.id,
          job_id,
          interaction_type: 'apply',
          interaction_data: {
            applied_at: new Date().toISOString(),
            via: 'web_ui'
          },
          source: 'web'
        })

      if (insertError) {
        console.error('Error inserting interaction:', insertError)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }
    } else {
      // Remove interaction record
      const { error: deleteError } = await supabase
        .from('user_job_interactions')
        .delete()
        .eq('user_profile_id', userProfile.id)
        .eq('job_id', job_id)
        .eq('interaction_type', 'apply')

      if (deleteError) {
        console.error('Error deleting interaction:', deleteError)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      job_id,
      applied
    })

  } catch (error) {
    console.error('Error in update-applied-status API:', error)
    return NextResponse.json(
      { error: 'Failed to update applied status' },
      { status: 500 }
    )
  }
}
