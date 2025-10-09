import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
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
      console.log('Share create: auth.getUser() failed:', e)
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      shareType,
      resumeId,
      variantId,
      template,
      expiresInDays
    } = body

    // Validate required fields
    if (!shareType || !['resume', 'cover_letter'].includes(shareType)) {
      return NextResponse.json(
        { error: 'Invalid share type. Must be "resume" or "cover_letter"' },
        { status: 400 }
      )
    }

    if (!resumeId && !variantId) {
      return NextResponse.json(
        { error: 'Either resumeId or variantId is required' },
        { status: 400 }
      )
    }

    // Generate unique token (URL-safe, 16 characters)
    const token = crypto.randomBytes(12).toString('base64url')

    // Calculate expiration date
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Create share token using database function (bypasses RLS)
    const { data: shareTokenData, error } = await supabase.rpc('create_share_token', {
      p_token: token,
      p_user_id: userId,
      p_share_type: shareType,
      p_resume_id: resumeId || null,
      p_variant_id: variantId || null,
      p_template: template || null,
      p_expires_at: expiresAt
    })

    if (error) {
      console.error('Error creating share token:', error)
      return NextResponse.json(
        { error: 'Failed to create share token' },
        { status: 500 }
      )
    }

    const shareToken = shareTokenData && shareTokenData.length > 0 ? shareTokenData[0] : null

    if (!shareToken) {
      console.error('No share token returned from database')
      return NextResponse.json(
        { error: 'Failed to create share token' },
        { status: 500 }
      )
    }

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const shareUrl = `${baseUrl}/share/${token}`

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      expiresAt: shareToken.expires_at
    })

  } catch (error) {
    console.error('Error in share create API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
