import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const feature = searchParams.get('feature')

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter required' }, { status: 400 })
    }

    // Call Postgres function to check access
    const { data, error } = await supabase.rpc('check_feature_access', {
      p_user_id: user.id,
      p_feature: feature,
    })

    if (error) {
      console.error('Error checking feature access:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching usage:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feature, count = 1 } = await req.json()

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter required' }, { status: 400 })
    }

    // Check if user has access before tracking
    const { data: accessCheck } = await supabase.rpc('check_feature_access', {
      p_user_id: user.id,
      p_feature: feature,
    })

    if (!accessCheck?.has_access) {
      return NextResponse.json({
        error: 'Feature limit reached',
        usage: accessCheck
      }, { status: 403 })
    }

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: user.id,
      p_feature: feature,
      p_count: count,
    })

    // Return updated usage
    const { data: updatedUsage } = await supabase.rpc('check_feature_access', {
      p_user_id: user.id,
      p_feature: feature,
    })

    return NextResponse.json({
      success: true,
      usage: updatedUsage
    })
  } catch (error: any) {
    console.error('Error tracking usage:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
