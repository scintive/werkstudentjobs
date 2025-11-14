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

    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !subscription) {
      // Return free plan as default
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', 'free')
        .single()

      return NextResponse.json({
        subscription: null,
        plan: freePlan,
        is_active: true,
        is_free: true,
      })
    }

    return NextResponse.json({
      subscription,
      plan: subscription.plan,
      is_active: subscription.status === 'active',
      is_free: subscription.plan_id === 'free',
    })
  } catch (error: any) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
