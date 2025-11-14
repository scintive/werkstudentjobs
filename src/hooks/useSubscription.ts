import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SubscriptionStatus {
  subscription: any
  plan: any
  is_active: boolean
  is_free: boolean
  loading: boolean
}

interface FeatureAccess {
  has_access: boolean
  is_unlimited: boolean
  used: number
  limit: number
  remaining: number
  loading: boolean
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscription: null,
    plan: null,
    is_active: false,
    is_free: true,
    loading: true,
  })

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        setStatus(prev => ({ ...prev, loading: false }))
        return
      }

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus({ ...data, loading: false })
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setStatus(prev => ({ ...prev, loading: false }))
    }
  }

  const checkFeatureAccess = async (feature: string): Promise<FeatureAccess> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        return {
          has_access: false,
          is_unlimited: false,
          used: 0,
          limit: 0,
          remaining: 0,
          loading: false,
        }
      }

      const response = await fetch(`/api/subscription/usage?feature=${feature}`, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return { ...data, loading: false }
      }

      return {
        has_access: false,
        is_unlimited: false,
        used: 0,
        limit: 0,
        remaining: 0,
        loading: false,
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return {
        has_access: false,
        is_unlimited: false,
        used: 0,
        limit: 0,
        remaining: 0,
        loading: false,
      }
    }
  }

  const trackUsage = async (feature: string, count: number = 1): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        return false
      }

      const response = await fetch('/api/subscription/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ feature, count })
      })

      return response.ok
    } catch (error) {
      console.error('Error tracking usage:', error)
      return false
    }
  }

  const isPro = () => {
    return status.plan?.id === 'pro' || status.plan?.id === 'enterprise'
  }

  const isEnterprise = () => {
    return status.plan?.id === 'enterprise'
  }

  return {
    ...status,
    isPro: isPro(),
    isEnterprise: isEnterprise(),
    checkFeatureAccess,
    trackUsage,
    refresh: loadSubscription,
  }
}
