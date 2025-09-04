import { NextRequest, NextResponse } from 'next/server'

// Sets httpOnly cookies for server routes to associate a browser with a logical session
// We map Supabase Auth's user.id to `user_session` so existing APIs can load resume data
export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('user_session', String(sessionId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    })
    if (email) {
      res.cookies.set('user_email', String(email), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60
      })
    }
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('user_session', '', { path: '/', maxAge: 0 })
  res.cookies.set('user_email', '', { path: '/', maxAge: 0 })
  return res
}

