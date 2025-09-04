import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/register
 * Create a new user profile with email and name
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }
    
    console.log('🔐 REGISTER: Creating profile for', name, 'with email:', email)
    
    // Check if user already exists
    const { data: existingProfiles, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .limit(1)
    
    if (checkError) {
      console.error('🔐 REGISTER: Database check error:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
    
    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }
    
    // Create new user profile
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        name: name,
        email: email,
        session_id: sessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('🔐 REGISTER: Profile creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }
    
    console.log('🔐 REGISTER: Created profile with session:', sessionId)
    
    // Set session cookies
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
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email
      }
    })
    
  } catch (error) {
    console.error('🔐 REGISTER: Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}