'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ResumeEditor } from './ResumeEditor'
import { ResumePreview } from './ResumePreview'

interface TailorLayoutProps {
  jobData?: any
  userProfile?: any
  onDataChange?: (data: any) => void
}

export function TailorLayout({ jobData, userProfile, onDataChange }: TailorLayoutProps) {
  const [resumeData, setResumeData] = React.useState<any>(null)
  const [template, setTemplate] = React.useState('swiss')
  const [loading, setLoading] = React.useState(true)
  const [aiSuggestions, setAiSuggestions] = React.useState<any[]>([])

  // Debug logging removed

  // Load real user data
  React.useEffect(() => {
    const loadUserData = async () => {
      
      
      try {
        // Get latest profile
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        const response = await fetch('/api/profile/latest', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.resumeData) {
            setResumeData(result.resumeData)
            
            
            // Generate AI suggestions
            if (jobData) {
              generateAISuggestions(result.resumeData)
            }
          }
        } else {
          
        }
      } catch (error) {
        
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [jobData])

  // Generate AI suggestions for resume optimization
  const generateAISuggestions = async (data: any) => {
    if (!jobData || !data) return
    
    
    
    const suggestions: any[] = []
    
    // Generate summary suggestion
    if (data.professionalSummary) {
      try {
        const response = await fetch('/api/jobs/resume/patches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobData.id,
            user_profile_id: 'latest',
            target: {
              section: 'summary',
              target_id: 'professional_summary',
              text: data.professionalSummary
            }
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            suggestions.push({
              id: 'summary_ai',
              type: 'summary',
              section: 'summary',
              original: data.professionalSummary,
              suggestion: result.patch.proposed_text,
              reason: result.patch.reasoning,
              keywords: result.patch.used_keywords || []
            })
          }
        }
      } catch (error) {
        
      }
    }
    
    setAiSuggestions(suggestions)
    
  }

  const handleSuggestionAccept = (suggestionId: string) => {
    const suggestion = aiSuggestions.find(s => s.id === suggestionId)
    if (suggestion && suggestion.section === 'summary') {
      setResumeData(prev => ({
        ...prev,
        professionalSummary: suggestion.suggestion
      }))
      // Remove accepted suggestion
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    }
  }

  const handleSuggestionReject = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }

  const handleDataChange = (newData: any) => {
    setResumeData(newData)
    onDataChange?.(newData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  if (!resumeData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Found</h3>
          <p className="text-gray-600 mb-4">
            Please upload your resume first to start tailoring it for this job.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Resume
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Resume Studio</h2>
            <p className="text-sm text-gray-600">Live editing with instant preview</p>
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor Column */}
        <div>
          <ResumeEditor
            data={resumeData}
            onChange={handleDataChange}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={handleSuggestionAccept}
            onSuggestionReject={handleSuggestionReject}
          />
        </div>
        
        {/* Preview Column */}
        <div className="sticky top-24 h-fit">
          <ResumePreview
            data={resumeData}
            template={template}
            onTemplateChange={setTemplate}
          />
        </div>
      </div>
    </div>
  )
}
