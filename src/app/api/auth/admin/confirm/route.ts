import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 501 })
    }

    const admin = createClient(url, serviceKey)
    // Confirm the email for this user (dev/admin use only)
    const { data, error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, user: { id: data.user?.id, email: data.user?.email } })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to confirm user' }, { status: 500 })
  }
}

