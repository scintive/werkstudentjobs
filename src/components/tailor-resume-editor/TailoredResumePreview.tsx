'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  X, 
  Eye, 
  Edit3, 
  Download, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Database,
  User,
  LogIn,
  FileText,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { resumeVariantService } from '@/lib/services/resumeVariantService'
import type { ResumeSuggestion } from '@/lib/services/resumeVariantService'
import { supabase } from '@/lib/supabase/client'
import { InlineSuggestionOverlay } from './InlineSuggestionOverlay'

interface TailoredResumePreviewProps {
  jobData: any
  baseResumeData: any
  baseResumeId: string
  strategy?: any
  onOpenInEditor?: (tailoredData: any, variantId?: string) => void
  onExportPDF?: (tailoredData: any) => void
  className?: string
}

export function TailoredResumePreview({ 
  jobData, 
  baseResumeData,
  baseResumeId,
  strategy,
  onOpenInEditor,
  onExportPDF,
  className 
}: TailoredResumePreviewProps) {
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([])
  const [variantId, setVariantId] = useState<string | null>(null)
  const [tailoredData, setTailoredData] = useState<any>(null)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [declinedSuggestions, setDeclinedSuggestions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'experience', 'skills']))
  const [selectedTemplate, setSelectedTemplate] = useState<string>('swiss')
  const [basePreviewHtml, setBasePreviewHtml] = useState<string>('')
  const [tailoredPreviewHtml, setTailoredPreviewHtml] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const baseIframeRef = useRef<HTMLIFrameElement>(null)
  const tailoredIframeRef = useRef<HTMLIFrameElement>(null)

  // Load selected template from localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem('selectedTemplate')
    if (savedTemplate) {
      setSelectedTemplate(savedTemplate)
    }
  }, [])

  // Generate tailored suggestions on mount using real GPT pipeline
  useEffect(() => {
    if (jobData && baseResumeData && baseResumeId) {
      fetchAnalysisWithTailoring()
    }
  }, [jobData, baseResumeData, baseResumeId])

  // Generate HTML preview for base resume
  useEffect(() => {
    if (baseResumeData && selectedTemplate) {
      generatePreviewHtml(baseResumeData, false)
    }
  }, [baseResumeData, selectedTemplate])

  // Generate HTML preview for tailored resume when data changes
  useEffect(() => {
    if (tailoredData && selectedTemplate) {
      generatePreviewHtml(tailoredData, true)
    }
  }, [tailoredData, selectedTemplate])

  // Inject inline suggestion chips into the tailored preview iframe
  useEffect(() => {
    const iframe = tailoredIframeRef.current
    if (!iframe || !suggestions || suggestions.length === 0) return

    const tryInject = () => {
      const doc = iframe.contentDocument
      if (!doc) return

      // Clear previous chips
      doc.querySelectorAll('[data-suggestion-chip]')?.forEach((el) => el.remove())

      const makeChip = (targetEl: HTMLElement, s: ResumeSuggestion) => {
        if (!targetEl) return
        targetEl.style.position = targetEl.style.position || 'relative'
        const chip = doc.createElement('div')
        chip.setAttribute('data-suggestion-chip', '1')
        chip.style.position = 'absolute'
        chip.style.top = '4px'
        chip.style.right = '4px'
        chip.style.zIndex = '9999'
        chip.style.display = 'flex'
        chip.style.gap = '6px'
        chip.style.background = 'rgba(16,185,129,0.1)'
        chip.style.border = '1px solid rgba(16,185,129,0.6)'
        chip.style.borderRadius = '12px'
        chip.style.padding = '4px 6px'
        chip.style.fontSize = '11px'
        chip.style.fontFamily = 'Inter, system-ui, Arial'
        chip.style.color = '#065f46'
        chip.style.backdropFilter = 'blur(2px)'
        
        const text = doc.createElement('span')
        text.textContent = s.section
        chip.appendChild(text)
        
        const accept = doc.createElement('button')
        accept.textContent = 'Accept'
        accept.style.background = '#10b981'
        accept.style.color = 'white'
        accept.style.border = 'none'
        accept.style.borderRadius = '10px'
        accept.style.padding = '2px 6px'
        accept.style.cursor = 'pointer'
        accept.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          // Call through to parent React handler
          handleSuggestionAccept(s.id)
        }
        chip.appendChild(accept)

        const decline = doc.createElement('button')
        decline.textContent = 'Decline'
        decline.style.background = '#6b7280'
        decline.style.color = 'white'
        decline.style.border = 'none'
        decline.style.borderRadius = '10px'
        decline.style.padding = '2px 6px'
        decline.style.cursor = 'pointer'
        decline.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          handleSuggestionDecline(s.id)
        }
        chip.appendChild(decline)

        targetEl.appendChild(chip)
      }

      // Find elements to anchor chips
      const summaryText = suggestions.find(s => (s.section === 'summary'))?.original_content
      if (summaryText) {
        const paras = Array.from(doc.querySelectorAll('p,div')) as HTMLElement[]
        const el = paras.find(p => (p.textContent || '').includes(summaryText))
        if (el) {
          suggestions.filter(s => s.section === 'summary').forEach(s => makeChip(el, s))
        }
      }

      // Experience bullets: try using original_content matching; fallback to index
      const expSuggestions = suggestions.filter(s => s.section === 'experience')
      if (expSuggestions.length) {
        const items = Array.from(doc.querySelectorAll('li')) as HTMLElement[]
        for (const s of expSuggestions) {
          let el = items.find(li => (li.textContent || '').trim().startsWith((s.original_content || '').slice(0, 40)))
          if (!el && s.target_id) {
            const m = s.target_id.match(/exp_(\d+)_bullet_(\d+)/)
            if (m) {
              const [, eIdx, bIdx] = m
              const idx = parseInt(bIdx)
              el = items[idx]
            }
          }
          if (el) makeChip(el, s)
        }
      }

      // Skills anchors to a header containing 'Skills'
      const skillsAnchor = Array.from(doc.querySelectorAll('h1,h2,h3,h4,strong'))
        .find(n => /skills/i.test(n.textContent || '')) as HTMLElement | undefined
      if (skillsAnchor) {
        suggestions.filter(s => s.section === 'skills').forEach(s => makeChip(skillsAnchor, s))
      }

      // Languages anchors to a header containing 'Languages'
      const langAnchor = Array.from(doc.querySelectorAll('h1,h2,h3,h4,strong'))
        .find(n => /languages/i.test(n.textContent || '')) as HTMLElement | undefined
      if (langAnchor) {
        suggestions.filter(s => s.section === 'languages').forEach(s => makeChip(langAnchor, s))
      }
    }

    const tid = setTimeout(tryInject, 300)
    return () => clearTimeout(tid)
  }, [tailoredPreviewHtml, suggestions])

  const generatePreviewHtml = async (resumeData: any, isTailored: boolean) => {
    try {
      const response = await fetch('/api/resume/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          template: selectedTemplate
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (isTailored) {
          setTailoredPreviewHtml(data.html)
        } else {
          setBasePreviewHtml(data.html)
        }
      }
    } catch (error) {
      console.error('Failed to generate preview HTML:', error)
    }
  }

  const fetchAnalysisWithTailoring = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Fetching unified analysis with tailoring...')
      
      // Check for auth session first - REQUIRED for API
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      
      if (!token) {
        console.warn('No auth token available - user must sign in')
        setError('auth_required') // Special error code for auth
        setLoading(false)
        return
      }

      // Call the unified endpoint with auth token
      const response = await fetch('/api/jobs/analyze-with-tailoring', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: jobData.id,
          base_resume_id: baseResumeId,
          force_refresh: false // Use cache if available
        })
      })

      // Handle specific error codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        if (response.status === 401) {
          setError('auth_required') // Special error code for auth
          setLoading(false)
          return
        } else if (response.status === 403) {
          setError("You don't have access to this resume")
          setLoading(false)
          return
        } else if (response.status === 404) {
          setError('no_resume') // Special error code for no resume
          setLoading(false)
          return
        } else if (response.status === 502) {
          // LLM failed - no fallback per requirements
          setError('Analysis service temporarily unavailable. Please try again.')
          setLoading(false)
          return
        }
        
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Analysis complete. Variant ID:', data.variant_id)
        
        // Set variant ID for future operations
        setVariantId(data.variant_id)
        
        // Set tailored resume data
        if (data.tailored_resume) {
          setTailoredData(data.tailored_resume)
        }
        
        // Fetch suggestions from Supabase
        if (data.variant_id) {
          const savedSuggestions = await resumeVariantService.getSuggestions(data.variant_id)
          setSuggestions(savedSuggestions)
          console.log(`📋 Loaded ${savedSuggestions.length} suggestions from Supabase`)
        }
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
      
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      setError('Failed to analyze resume for this job. Please try again.')
      
      // Still set tailored data to base so preview works
      setTailoredData(baseResumeData)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionAccept = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion || !tailoredData || !variantId) return

    setSaving(true)
    
    try {
      // Update suggestion status in Supabase
      const updated = await resumeVariantService.updateSuggestionStatus(suggestionId, true)
      
      if (updated) {
        // Apply suggestion to tailored data locally
        const updatedTailoredData = applySuggestionToData(tailoredData, suggestion)
        setTailoredData(updatedTailoredData)
        
        // Update variant in Supabase
        await resumeVariantService.updateVariant(
          variantId,
          updatedTailoredData,
          [...Array.from(appliedSuggestions), suggestionId]
        )
        
        setAppliedSuggestions(prev => new Set([...prev, suggestionId]))
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        
        console.log('✅ Suggestion accepted and saved to Supabase:', suggestionId)
      }
    } catch (error) {
      console.error('Failed to accept suggestion:', error)
    } finally {
      setSaving(false)
    }
  }, [suggestions, tailoredData, variantId, appliedSuggestions])

  const handleSuggestionDecline = useCallback(async (suggestionId: string) => {
    if (!variantId) return
    
    // Optimistic update - hide immediately
    setDeclinedSuggestions(prev => new Set([...prev, suggestionId]))
    
    // Persist to database in background
    setSaving(true)
    try {
      // Mark suggestion as declined (accepted=false)
      await resumeVariantService.updateSuggestionStatus(suggestionId, false)
      console.log('❌ Suggestion declined:', suggestionId)
    } catch (error) {
      console.error('Failed to decline suggestion:', error)
      // Revert on error
      setDeclinedSuggestions(prev => {
        const next = new Set(prev)
        next.delete(suggestionId)
        return next
      })
    } finally {
      setSaving(false)
    }
  }, [variantId])

  const handleApplyAll = useCallback(async () => {
    if (!variantId || suggestions.length === 0) return
    
    setSaving(true)
    
    try {
      let updatedData = { ...tailoredData }
      const acceptedIds: string[] = []
      
      // Apply all suggestions
      for (const suggestion of suggestions) {
        updatedData = applySuggestionToData(updatedData, suggestion)
        await resumeVariantService.updateSuggestionStatus(suggestion.id, true)
        acceptedIds.push(suggestion.id)
      }
      
      // Update variant with all changes
      await resumeVariantService.updateVariant(
        variantId,
        updatedData,
        [...Array.from(appliedSuggestions), ...acceptedIds]
      )
      
      setTailoredData(updatedData)
      setAppliedSuggestions(prev => new Set([...prev, ...acceptedIds]))
      setSuggestions([])
      
      console.log(`✅ Applied all ${acceptedIds.length} suggestions`)
    } catch (error) {
      console.error('Failed to apply all suggestions:', error)
    } finally {
      setSaving(false)
    }
  }, [suggestions, tailoredData, variantId, appliedSuggestions])

  const handleReset = useCallback(async () => {
    if (!variantId) return
    
    setSaving(true)
    
    try {
      // Reset variant to base data
      await resumeVariantService.updateVariant(variantId, baseResumeData, [])
      
      // Reload suggestions
      const savedSuggestions = await resumeVariantService.getSuggestions(variantId)
      
      // Reset all suggestion statuses
      for (const suggestion of savedSuggestions) {
        if (suggestion.accepted !== null) {
          await resumeVariantService.updateSuggestionStatus(suggestion.id, false)
        }
      }
      
      setTailoredData(baseResumeData)
      setSuggestions(savedSuggestions)
      setAppliedSuggestions(new Set())
      
      console.log('🔄 Reset to base resume')
    } catch (error) {
      console.error('Failed to reset:', error)
    } finally {
      setSaving(false)
    }
  }, [variantId, baseResumeData])

  const handleRetry = useCallback(() => {
    fetchAnalysisWithTailoring()
  }, [jobData, baseResumeData, baseResumeId])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  // Helper to apply a suggestion to resume data
  const applySuggestionToData = (data: any, suggestion: ResumeSuggestion): any => {
    const updatedData = { ...data }

    switch (suggestion.section) {
      case 'summary':
        updatedData.professionalSummary = suggestion.suggested_content
        break

      case 'experience':
        if (suggestion.target_id) {
          const [, expIndex, , bulletIndex] = suggestion.target_id.split('_')
          const expIdx = parseInt(expIndex)
          const bulIdx = parseInt(bulletIndex)
          
          if (updatedData.experience?.[expIdx]?.achievements?.[bulIdx] !== undefined) {
            updatedData.experience[expIdx].achievements[bulIdx] = suggestion.suggested_content
          }
        }
        break

      case 'skills':
        if (suggestion.suggestion_type === 'skill_addition' && suggestion.suggested_content) {
          // Parse skills to add
          const skillsToAdd = suggestion.suggested_content
            .replace(/^Add:\s*/i, '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
          
          if (!updatedData.skills) {
            updatedData.skills = {}
          }
          
          // Add to appropriate category
          const category = suggestion.target_id || 'Additional Skills'
          if (!updatedData.skills[category]) {
            updatedData.skills[category] = []
          }
          updatedData.skills[category].push(...skillsToAdd)
        }
        break

      case 'languages':
        if (suggestion.suggestion_type === 'language_addition' && suggestion.suggested_content) {
          if (!updatedData.languages) {
            updatedData.languages = []
          }
          updatedData.languages.push(suggestion.suggested_content)
        }
        break
    }

    return updatedData
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-20', className)}>
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Resume</h3>
          <p className="text-gray-600">Creating job-specific suggestions from GPT...</p>
        </div>
      </div>
    )
  }

  const currentData = tailoredData || baseResumeData

  return (
    <div className={cn('space-y-6', className)}>
      {/* Auth Required Banner */}
      {error === 'auth_required' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Sign in to tailor your resume</p>
                <p className="text-xs text-blue-600 mt-1">Authentication is required to use AI tailoring features</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      )}
      
      {/* No Resume Banner */}
      {error === 'no_resume' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">No resume found</p>
                <p className="text-xs text-purple-600 mt-1">Upload or create a resume to start tailoring</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              {onOpenInEditor && (
                <button
                  onClick={() => onOpenInEditor({}, undefined)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  Create in Editor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generic Error Banner */}
      {error && error !== 'auth_required' && error !== 'no_resume' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{error}</p>
                <p className="text-xs text-yellow-600 mt-1">You can still preview and edit your resume</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tailored Resume Preview</h3>
              <p className="text-sm text-gray-600">
                {variantId ? (
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Variant saved in Supabase • 
                    {suggestions.length > 0 
                      ? ` ${suggestions.length} suggestions available • ${appliedSuggestions.size} applied`
                      : appliedSuggestions.size > 0 
                        ? ` ${appliedSuggestions.size} changes applied`
                        : ' Resume optimized'
                    }
                  </span>
                ) : 'Initializing...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Saving...</span>
              </div>
            )}
            
            {suggestions.length > 0 && !saving && (
              <>
                <motion.button
                  onClick={handleApplyAll}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply All
                </motion.button>
                
                <motion.button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </motion.button>
              </>
            )}
            
            {onOpenInEditor && (
              <motion.button
                onClick={() => onOpenInEditor(currentData, variantId || undefined)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-4 h-4" />
                Open in Editor
              </motion.button>
            )}
            
            {onExportPDF && (
              <motion.button
                onClick={() => onExportPDF(currentData)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Debug List (only when SHOW_LIST_DEBUG is true in localStorage) */}
      {typeof window !== 'undefined' && localStorage.getItem('SHOW_LIST_DEBUG') === 'true' && suggestions.length > 0 && (
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => handleSuggestionAccept(suggestion.id)}
              onDecline={() => handleSuggestionDecline(suggestion.id)}
              isExpanded={expandedSections.has(suggestion.section)}
              onToggleExpanded={() => toggleSection(suggestion.section)}
              disabled={saving}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Side-by-side Resume Previews with Real Templates */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Baseline Resume Preview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Current Resume</h3>
              <div className="text-sm text-gray-500">Baseline • {selectedTemplate}</div>
            </div>
          </div>
          
          <div className="relative h-[800px] overflow-hidden bg-gray-50">
            {basePreviewHtml ? (
              <iframe
                ref={baseIframeRef}
                srcDoc={basePreviewHtml}
                className="w-full h-full border-0"
                title="Baseline Resume Preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Tailored Resume Preview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tailored Resume</h3>
              <div className="text-sm text-green-600 font-medium">
                {appliedSuggestions.size > 0 ? `${appliedSuggestions.size} improvements` : 'Ready to tailor'}
              </div>
            </div>
          </div>
          
          <div className="relative h-[800px] overflow-hidden bg-gray-50">
            {tailoredPreviewHtml || basePreviewHtml ? (
              <>
                <iframe
                  ref={tailoredIframeRef}
                  srcDoc={tailoredPreviewHtml || basePreviewHtml}
                  className="w-full h-full border-0"
                  title="Tailored Resume Preview"
                  sandbox="allow-same-origin"
                />
                {/* Inline Suggestion Overlays */}
                <InlineSuggestionOverlay
                  iframeRef={tailoredIframeRef}
                  suggestions={suggestions.filter(s => !appliedSuggestions.has(s.id) && !declinedSuggestions.has(s.id))}
                  onAccept={handleSuggestionAccept}
                  onDecline={handleSuggestionDecline}
                  acceptedSuggestions={appliedSuggestions}
                  declinedSuggestions={declinedSuggestions}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      {suggestions.length === 0 && appliedSuggestions.size === 0 && !error && !loading && (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume is Job-Ready!</h3>
          <p className="text-gray-600">Your resume is already well-optimized for this position.</p>
          {variantId && (
            <p className="text-sm text-gray-500 mt-2">
              Variant ID: {variantId}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Individual suggestion card with atomic accept/decline
function SuggestionCard({ 
  suggestion, 
  onAccept, 
  onDecline,
  isExpanded,
  onToggleExpanded,
  disabled = false
}: {
  suggestion: ResumeSuggestion
  onAccept: () => void
  onDecline: () => void
  isExpanded: boolean
  onToggleExpanded: () => void
  disabled?: boolean
}) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'summary': return <Target className="w-4 h-4" />
      case 'experience': return <Zap className="w-4 h-4" />
      case 'skills': return <Sparkles className="w-4 h-4" />
      case 'languages': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded">
                {getSectionIcon(suggestion.section)}
              </div>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {suggestion.section}
              </span>
              <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getImpactColor(suggestion.impact))}>
                {suggestion.impact} impact
              </span>
              <span className="text-xs text-gray-500">
                {suggestion.confidence}% confidence
              </span>
              <Database className="w-3 h-3 text-gray-400" title="Stored in Supabase" />
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{suggestion.rationale}</p>
            
            {suggestion.ats_relevance && (
              <div className="flex items-center gap-2 mb-3 text-xs text-blue-600">
                <AlertCircle className="w-3 h-3" />
                {suggestion.ats_relevance}
              </div>
            )}
            
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4 pt-4 border-t border-gray-100"
              >
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Original:</div>
                  <div className="text-sm text-gray-800 bg-red-50 rounded p-3 border border-red-100">
                    {suggestion.original_content}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Suggested:</div>
                  <div className="text-sm text-gray-800 bg-green-50 rounded p-3 border border-green-100">
                    {suggestion.suggested_content}
                  </div>
                </div>
                
                {suggestion.keywords && suggestion.keywords.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Keywords added:</div>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onToggleExpanded}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <motion.button
              onClick={onAccept}
              disabled={disabled}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
            >
              <CheckCircle className="w-3 h-3" />
              Accept
            </motion.button>
            
            <motion.button
              onClick={onDecline}
              disabled={disabled}
              className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium"
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
            >
              <X className="w-3 h-3" />
              Decline
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
