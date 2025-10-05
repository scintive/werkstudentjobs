'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface RequireAuthProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)
  const [userInfo, setUserInfo] = React.useState<any>(null)
  const router = useRouter()

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUserInfo({ name: data.session.user.user_metadata?.name || '', email: data.session.user.email })
        setIsAuthenticated(true)
        return
      }
      setIsAuthenticated(false)
    }
    checkAuth()
  }, [])

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    router.push('/login')
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      )
    )
  }

  // Authenticated - show children
  return <>{children}</>
}
