import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Admin endpoint to clear all session cookies
 * POST - Clear user session cookies for fresh start
 */

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Clear user session cookies
    cookieStore.delete('user_session')
    cookieStore.delete('user_email')
    
    console.log('🧹 ADMIN: Cleared all session cookies')

    const response = NextResponse.json({
      success: true,
      message: 'Session cookies cleared successfully'
    })

    // Also set expired cookies in response to clear client-side
    response.cookies.set('user_session', '', { 
      expires: new Date(0),
      httpOnly: true,
      path: '/'
    })
    response.cookies.set('user_email', '', { 
      expires: new Date(0),
      httpOnly: true,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Admin clear session error:', error)
    return NextResponse.json(
      { error: 'Clear session operation failed' },
      { status: 500 }
    )
  }
}