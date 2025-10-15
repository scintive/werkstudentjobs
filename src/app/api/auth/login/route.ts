import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/login
 * Simple email-based login that creates a session
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    console.log('🔐 AUTH: Login attempt for', email)
    
    // Find user profile by email
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (profileError) {
      console.error('🔐 AUTH: Database error:', profileError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('🔐 AUTH: No profile found for', email, '- redirecting to onboarding')
      return NextResponse.json({
        success: true,
        newUser: true,
        message: 'New user - redirect to upload',
        sessionId: `session_new_${Date.now()}`,
        user: {
          email: email,
          name: '',
          id: null
        }
      })
    }
    
    const profile = profiles[0] as any
    console.log('🔐 AUTH: Found profile for', profile.name, 'with session:', profile.session_id)
    
    // Create session response
    const sessionId = profile.session_id || `session_${Date.now()}`
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    cookieStore.set('user_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email
      }
    })
    
  } catch (error) {
    console.error('🔐 AUTH: Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}