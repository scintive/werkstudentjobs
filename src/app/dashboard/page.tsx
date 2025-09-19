'use client'

import * as React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { FileText, Briefcase, Wand2, LogOut, Upload, Copy, ChevronRight, Edit3 } from 'lucide-react'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [resumeName, setResumeName] = React.useState<string>('')
  const [completeness, setCompleteness] = React.useState<number>(0)
  const [jobsCount, setJobsCount] = React.useState<number>(0)
  const [resumeVariants, setResumeVariants] = React.useState<any[]>([])
  const [baseResumeId, setBaseResumeId] = React.useState<string | null>(null)

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
          .select('id, personal_info, profile_completeness')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
        if (data && data.length > 0) {
          const rec: any = data[0]
          setResumeName(rec.personal_info?.name || '')
          setCompleteness(Math.round((rec.profile_completeness || 0) * 100))
          setBaseResumeId(rec.id)
          
          // Fetch resume variants for this base resume
          // First try with join, fallback to simple query if it fails
          let { data: variants, error: variantsError } = await supabase
            .from('resume_variants')
            .select(`
              id,
              job_id,
              variant_name,
              match_score,
              created_at,
              updated_at,
              jobs (
                title,
                company_name
              )
            `)
            .eq('base_resume_id', rec.id)
            .order('updated_at', { ascending: false })
          
          if (variantsError) {
            console.warn('Failed to fetch variants with jobs, trying without join:', variantsError.message)
            // Fallback: fetch without the join
            const simpleResult = await supabase
              .from('resume_variants')
              .select('*')
              .eq('base_resume_id', rec.id)
              .order('updated_at', { ascending: false })
            
            if (simpleResult.error) {
              console.error('Error fetching resume variants (simple):', simpleResult.error)
              setResumeVariants([])
            } else {
              // Fetch job details separately if needed
              const variantsWithJobs = await Promise.all(
                (simpleResult.data || []).map(async (variant) => {
                  if (variant.job_id) {
                    const { data: job } = await supabase
                      .from('jobs')
                      .select('title, company_name')
                      .eq('id', variant.job_id)
                      .single()
                    return { ...variant, jobs: job }
                  }
                  return variant
                })
              )
              setResumeVariants(variantsWithJobs)
            }
          } else if (variants) {
            setResumeVariants(variants)
          }
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
            {baseResumeId && (
              <Link href="/?edit=1" className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-1">
                <Edit3 className="w-4 h-4" /> Edit Resume
              </Link>
            )}
            <Link href="/?upload=new" className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1">
              <Upload className="w-4 h-4" /> Upload New
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

      {/* Resume Variants Section */}
      {resumeVariants.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tailored Resume Versions</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {resumeVariants.map((variant) => (
                <div key={variant.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {variant.variant_name || `Tailored for ${variant.jobs?.title || 'Unknown Job'}`}
                        </span>
                        {variant.match_score && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {variant.match_score}% match
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {variant.jobs?.company_name || 'Unknown Company'}
                        <span className="mx-2">•</span>
                        Updated {new Date(variant.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/jobs/${variant.job_id}/tailor?variant_id=${variant.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {resumeVariants.length} tailored {resumeVariants.length === 1 ? 'version' : 'versions'} created from your base resume
          </div>
        </div>
      )}
    </div>
  )
}

