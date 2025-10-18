'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PerfectStudio } from '@/components/resume-editor/PerfectStudio'
import { SupabaseResumeProvider } from '@/lib/contexts/SupabaseResumeContext'
import { EditModeProvider } from '@/lib/contexts/EditModeContext'

// Force dynamic rendering to prevent build-time errors with auth
export const dynamic = 'force-dynamic'

export default function EditResumePage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)

      // Check if resume exists
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('id')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (!resumeData || resumeData.length === 0) {
        // No resume, redirect to upload
        router.push('/upload')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading || !userId) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <EditModeProvider>
      <SupabaseResumeProvider mode="base">
        <div className="min-h-screen bg-gray-50">
          <PerfectStudio mode="base" />
        </div>
      </SupabaseResumeProvider>
    </EditModeProvider>
  )
}
