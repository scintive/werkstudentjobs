import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/debug/cookies
 * Debug endpoint to see what cookies are being sent by the browser
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🍪 DEBUG: Cookie debugging endpoint called')
    
    // Get cookies using Next.js cookies() function
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    const userEmail = cookieStore.get('user_email')?.value
    
    // Also get raw cookie header
    const rawCookieHeader = request.headers.get('cookie')
    
    // Parse cookies manually from header
    const parsedCookies: Record<string, string> = {}
    if (rawCookieHeader) {
      rawCookieHeader.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          parsedCookies[key] = decodeURIComponent(value)
        }
      })
    }
    
    console.log('🍪 DEBUG: Next.js cookies():', { sessionId, userEmail })
    console.log('🍪 DEBUG: Raw cookie header:', rawCookieHeader)
    console.log('🍪 DEBUG: Parsed cookies:', parsedCookies)
    
    return NextResponse.json({
      success: true,
      nextjs_cookies: {
        user_session: sessionId,
        user_email: userEmail
      },
      raw_header: rawCookieHeader,
      parsed_cookies: parsedCookies,
      all_cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value]))
    })
    
  } catch (error) {
    console.error('🍪 DEBUG: Error:', error)
    return NextResponse.json(
      { error: 'Failed to debug cookies' },
      { status: 500 }
    )
  }
}