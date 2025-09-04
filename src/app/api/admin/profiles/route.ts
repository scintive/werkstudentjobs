import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * Admin endpoint to manage user profiles
 * GET - List all profiles
 * DELETE - Delete all profiles (use with caution)
 */

export async function GET(request: NextRequest) {
  try {
    // Get all user profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin profiles fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: profiles?.length || 0,
      profiles: profiles || []
    })

  } catch (error) {
    console.error('Admin profiles error:', error)
    return NextResponse.json(
      { error: 'Admin operation failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ ADMIN: Deleting all user profiles...')

    // Delete all user profiles
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except dummy

    if (profilesError) {
      console.error('Delete profiles error:', profilesError)
      return NextResponse.json(
        { error: 'Failed to delete profiles' },
        { status: 500 }
      )
    }

    // Also clean up resume_data
    const { error: resumeError } = await supabase
      .from('resume_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except dummy

    if (resumeError) {
      console.warn('Delete resume_data warning:', resumeError)
      // Continue anyway
    }

    console.log('🗑️ ADMIN: All profiles deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'All user profiles and resume data deleted'
    })

  } catch (error) {
    console.error('Admin delete error:', error)
    return NextResponse.json(
      { error: 'Delete operation failed' },
      { status: 500 }
    )
  }
}