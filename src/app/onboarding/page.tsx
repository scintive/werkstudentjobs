'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || null)

      // Check if already completed onboarding
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single()

      if (profileData?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      // Resume upload is now part of onboarding flow (Step 0)
      // No need to check for resume_data or redirect to /upload
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleComplete = () => {
    router.push('/edit-resume')
  }

  if (loading || !userId || !userEmail) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      userId={userId}
      userEmail={userEmail}
    />
  )
}
