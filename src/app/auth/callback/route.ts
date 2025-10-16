import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // Create a Supabase client with the service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    if (data.session?.user) {
      // Map auth user to httpOnly session cookies for server routes
      try {
        await fetch(`${requestUrl.origin}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: data.session.user.id,
            email: data.session.user.email
          })
        })
      } catch (err) {
        console.error('Error setting session:', err)
      }

      // Set the session in cookies for the browser
      const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

      // Set the access token and refresh token in cookies
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return response
    }
  }

  // If no code or session failed, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
