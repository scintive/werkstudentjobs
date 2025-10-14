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
        <div className="relative">
          {/* Outer spinning circle */}
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-4 h-4 bg-blue-600 rounded-full"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
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
