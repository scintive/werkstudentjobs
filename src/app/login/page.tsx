'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  // If already authenticated, redirect to jobs
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace('/jobs')
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message)
        throw error
      }

      if (data.session?.user) {
        // Map auth user to httpOnly session cookies for server routes
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: data.session.user.id, email: data.session.user.email })
        })
        // Route to Home for onboarding logic; Home redirects to Jobs when profile exists
        router.push('/')
      } else {
      setErrorMsg('Check your email to confirm your account, then log in.')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (!errorMsg) setErrorMsg('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your resume and job matching</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          New here? <a href="/register" className="text-blue-600 hover:underline">Create an account</a>
        </div>

        <div className="mt-3 text-center text-sm text-gray-600">
          Trouble signing in?{' '}
          <button
            onClick={async () => {
              try {
                setErrorMsg(null)
                await supabase.auth.resend({ type: 'signup', email })
                setErrorMsg('Confirmation email resent. Please check your inbox.')
              } catch (e: any) {
                setErrorMsg(e?.message || 'Failed to resend confirmation email')
              }
            }}
            className="text-blue-600 hover:underline mr-2"
            type="button"
          >
            Resend confirmation
          </button>
          <button
            onClick={async () => {
              try {
                setErrorMsg(null)
                await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
                setErrorMsg('Password reset email sent. Follow the link to set a new password.')
              } catch (e: any) {
                setErrorMsg(e?.message || 'Failed to send password reset email')
              }
            }}
            className="text-blue-600 hover:underline"
            type="button"
          >
            Forgot password
          </button>
        </div>
      </div>
    </div>
  )
}
