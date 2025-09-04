'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const doLogout = async () => {
      try { await supabase.auth.signOut() } catch {}
      try { await fetch('/api/auth/session', { method: 'DELETE' }) } catch {}
      // Clear local storage fallbacks
      try {
        localStorage.removeItem('resume_session_id')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_email')
      } catch {}
      router.replace('/login')
    }
    doLogout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Signing you out…</div>
    </div>
  )
}

