'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthCheck'
import { PerfectStudio } from '@/components/resume-editor/PerfectStudio'
import { SupabaseResumeProvider } from '@/lib/contexts/SupabaseResumeContext'
import { supabase } from '@/lib/supabase/client'

/**
 * Unified Tailor Page
 * Single editor with variant support and inline suggestions
 */
export default function UnifiedTailorPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const { userId, isLoaded } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobData, setJobData] = useState<any>(null)
  const [baseResumeData, setBaseResumeData] = useState<any>(null)
  const [baseResumeId, setBaseResumeId] = useState<string | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [variantData, setVariantData] = useState<any>(null)

  // Fetch data on mount
  useEffect(() => {
    if (!isLoaded || !userId) return
    fetchData()
  }, [isLoaded, userId, jobId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Fetch job details
      const jobResponse = await fetch(`/api/jobs/details?job_id=${jobId}`)
      if (!jobResponse.ok) throw new Error('Failed to fetch job details')
      const job = await jobResponse.json()
      setJobData(job)

      // 2. Get user's base resume
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const profileResponse = await fetch('/api/profile/latest', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}` 
        },
        credentials: 'include'
      })
      
      if (!profileResponse.ok) throw new Error('Failed to fetch profile')
      
      const profileData = await profileResponse.json()
      if (!profileData.success || !profileData.profile) {
        throw new Error('No profile found')
      }

      setBaseResumeData(profileData.profile)
      setBaseResumeId(profileData.resumeId)

      // 3. Check for existing variant or create one
      await getOrCreateVariant(profileData.resumeId, job.id)

    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getOrCreateVariant = async (resumeId: string, jobId: string) => {
    try {
      // Check if variant exists
      const { data: existingVariant } = await supabase
        .from('resume_variants')
        .select('*')
        .eq('base_resume_id', resumeId)
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single()

      if (existingVariant) {
        console.log('Found existing variant:', existingVariant.id)
        setVariantId(existingVariant.id)
        setVariantData(existingVariant.tailored_data || baseResumeData)
        
        // Load existing suggestions if any
        const { data: suggestions } = await supabase
          .from('resume_suggestions')
          .select('*')
          .eq('variant_id', existingVariant.id)
        
        console.log(`Loaded ${suggestions?.length || 0} existing suggestions`)
      } else {
        // Create new variant
        console.log('Creating new variant...')
        const { data: newVariant, error } = await supabase
          .from('resume_variants')
          .insert({
            base_resume_id: resumeId,
            job_id: jobId,
            user_id: userId,
            tailored_data: baseResumeData,
            is_active: true
          })
          .select()
          .single()

        if (error) throw error

        console.log('Created variant:', newVariant.id)
        setVariantId(newVariant.id)
        setVariantData(baseResumeData)

        // Generate suggestions for new variant
        await generateSuggestions(newVariant.id, resumeId, jobId)
      }
    } catch (error) {
      console.error('Failed to get/create variant:', error)
      throw error
    }
  }

  const generateSuggestions = async (variantId: string, resumeId: string, jobId: string) => {
    try {
      console.log('Generating AI suggestions...')
      
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session available for generating suggestions')
        return
      }
      
      const response = await fetch('/api/jobs/analyze-with-tailoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          job_id: jobId,
          base_resume_id: resumeId,
          variant_id: variantId
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        console.warn('Failed to generate suggestions')
      } else {
        const result = await response.json()
        console.log(`Generated ${result.atomic_suggestions?.length || 0} suggestions`)
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Preparing tailored resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </button>
            
            {jobData && (
              <div className="flex items-center gap-3">
                <div className="w-px h-6 bg-gray-300" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Tailoring for: {jobData.title}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {jobData.company_name} • {jobData.city || jobData.location_city}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="text-sm font-medium text-amber-700">
                AI Suggestions Active
              </span>
            </div>
            
            {variantId && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-300 rounded-full">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Auto-saving to variant
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden">
        {variantData && variantId && jobData ? (
          <SupabaseResumeProvider 
            initialData={variantData}
            mode="tailor"
            variantId={variantId}
            jobId={jobId}
            baseResumeId={baseResumeId}
          >
            <PerfectStudio 
              mode="tailor"
              jobData={jobData}
              variantId={variantId}
              baseResumeId={baseResumeId}
            />
          </SupabaseResumeProvider>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Initializing editor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}