'use client'

import * as React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { FileText, Briefcase, Wand2, LogOut, Upload } from 'lucide-react'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [resumeName, setResumeName] = React.useState<string>('')
  const [completeness, setCompleteness] = React.useState<number>(0)
  const [jobsCount, setJobsCount] = React.useState<number>(0)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!mounted) return
      const email = sessionData.session?.user?.email || null
      setUserEmail(email)

      // Fetch latest resume_data for this user (if any)
      if (email) {
        const userId = sessionData.session!.user!.id
        const { data } = await supabase
          .from('resume_data')
          .select('personal_info, profile_completeness')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
        if (data && data.length > 0) {
          const rec: any = data[0]
          setResumeName(rec.personal_info?.name || '')
          setCompleteness(Math.round((rec.profile_completeness || 0) * 100))
        }
      }

      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      setJobsCount(count || 0)
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Quick links and status at a glance</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Account</h2>
            <LogOut className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-gray-700 text-sm">{userEmail || 'Not signed in'}</div>
          <div className="mt-3 flex gap-2">
            {userEmail ? (
              <Link href="/logout" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">Logout</Link>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Login</Link>
                <Link href="/register" className="px-3 py-1.5 rounded bg-gray-100 text-sm">Register</Link>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Resume</h2>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-gray-700 text-sm">{resumeName || 'No resume loaded'}</div>
          <div className="text-xs text-gray-500">Completeness: {completeness}%</div>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1">
              <Upload className="w-4 h-4" /> Upload
            </Link>
            <Link href="/jobs" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1">
              <Briefcase className="w-4 h-4" /> Jobs
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Tailor</h2>
            <Wand2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-gray-700 text-sm">Active jobs in DB: {jobsCount}</div>
          <div className="mt-3">
            <Link href="/jobs" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Open Job Browser</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

