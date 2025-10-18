/**
 * Simplified Tailored Preview Component
 * Single responsibility: Display base/tailored resume comparison with inline suggestions
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Eye, Edit3, Sparkles, CheckCircle } from 'lucide-react'
import { tailorAnalysisService } from '@/lib/services/tailorAnalysisService'
import { useSuggestionManager } from '@/hooks/useSuggestionManager'
import { InlineSuggestionRenderer } from './InlineSuggestionRenderer'

interface SimpleTailoredPreviewProps {
  jobData: any
  baseResumeData: any
  baseResumeId: string
  onStatsChange?: (stats: unknown) => void
  onOpenInEditor?: (tailoredData: unknown, variantId: string) => void
}

export function SimpleTailoredPreview({
  jobData,
  baseResumeData,
  baseResumeId,
  onStatsChange,
  onOpenInEditor
}: SimpleTailoredPreviewProps) {
  // State
  const [loading, setLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('swiss')
  const [basePreviewHtml, setBasePreviewHtml] = useState<string>('')
  const [tailoredPreviewHtml, setTailoredPreviewHtml] = useState<string>('')
  
  // Refs
  const baseIframeRef = useRef<HTMLIFrameElement>(null)
  const tailoredIframeRef = useRef<HTMLIFrameElement>(null)
  const initializationRef = useRef(false)

  // Hooks
  const suggestionManager = useSuggestionManager()

  // Load template from localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem('selectedTemplate')
    if (savedTemplate) {
      setSelectedTemplate(savedTemplate)
    }
  }, [])

  // Track initialization to prevent multiple analysis calls
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize analysis on mount (only once)
  useEffect(() => {
    if (!jobData || !baseResumeData || !baseResumeId || isInitialized) return
    
    console.log('🚀 SimpleTailoredPreview: Initializing analysis (one time only)', {
      jobId: jobData?.id,
      baseResumeId,
      hasBaseData: !!baseResumeData
    })
    setIsInitialized(true)
    initializeAnalysis()
  }, [jobData?.id, baseResumeId, isInitialized]) // Only depend on IDs, not full objects

  // Generate base preview when component is ready
  useEffect(() => {
    const generateBasePreview = async () => {
      if (!baseResumeData || !selectedTemplate || !isInitialized) return
      
      console.log('📄 Generating base preview for template:', selectedTemplate)
      console.log('🔍 Base resume data keys:', Object.keys(baseResumeData))
      console.log('🔍 Base resume sample:', {
        name: baseResumeData?.personalInfo?.name,
        title: baseResumeData?.professionalTitle,
        summary: baseResumeData?.professionalSummary?.substring(0, 50),
        experienceCount: baseResumeData?.experience?.length || 0
      })
      
      try {
        const response = await fetch('/api/resume/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeData: baseResumeData,
            template: selectedTemplate
          })
        })

        if (!response.ok) {
          throw new Error(`Preview generation failed: ${response.status}`)
        }

        const result = await response.json()
        setBasePreviewHtml(result.html)
        console.log('✅ Base preview generated successfully')
      } catch (error) {
        console.error('❌ Base preview generation failed:', error)
      }
    }

    generateBasePreview()
  }, [selectedTemplate, isInitialized]) // Simplified dependencies - only template and initialization status

  // Generate tailored preview when suggestions are loaded
  useEffect(() => {
    const generateTailoredPreview = async () => {
      if (suggestionManager.suggestions.length === 0) return
      
      // IMPORTANT: Use BASE resume data, not tailored data
      // Suggestions will be overlaid on top by InlineSuggestionRenderer
      if (!baseResumeData || !selectedTemplate) return

      console.log('📄 Generating tailored preview with BASE resume (suggestions will overlay)')
      console.log('🔍 Using base resume data for preview')
      console.log('✨ Suggestions will be injected as overlays:', suggestionManager.suggestions.length)
      
      try {
        const response = await fetch('/api/resume/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeData: baseResumeData, // Use BASE resume, not tailored
            template: selectedTemplate
          })
        })

        if (!response.ok) {
          throw new Error(`Preview generation failed: ${response.status}`)
        }

        const result = await response.json()
        setTailoredPreviewHtml(result.html)
        console.log('✅ Tailored preview generated successfully')
      } catch (error) {
        console.error('❌ Tailored preview generation failed:', error)
      }
    }

    generateTailoredPreview()
  }, [suggestionManager.suggestions.length, selectedTemplate]) // Only depend on primitive values

  // Update stats when suggestion counts change (using primitive values only)
  useEffect(() => {
    if (onStatsChange) {
      const stats = {
        total: suggestionManager.suggestions.length,
        pending: suggestionManager.suggestions.length - suggestionManager.appliedSuggestions.size - suggestionManager.declinedSuggestions.size,
        accepted: suggestionManager.appliedSuggestions.size,
        declined: suggestionManager.declinedSuggestions.size
      }
      onStatsChange(stats)
    }
  }, [suggestionManager.suggestions.length, suggestionManager.appliedSuggestions.size, suggestionManager.declinedSuggestions.size])

  const initializeAnalysis = async () => {
    if (!jobData || !baseResumeData || !baseResumeId) return

    setLoading(true)
    setAnalysisError(null)

    try {
      console.log('🚀 Initializing tailored analysis')
      
      const result = await tailorAnalysisService.getAnalysis({
        jobId: jobData.id,
        baseResumeId,
        baseResumeData,
        jobData
      })

      console.log('📊 Analysis result:', {
        strategy: !!result.strategy,
        tailoredResume: !!result.tailoredResume,
        suggestions: result.suggestions?.length || 0,
        variantId: result.variantId
      })

      // Load suggestions into manager
      console.log('📦 Loading suggestions into manager:', {
        suggestionsCount: result.suggestions?.length || 0,
        hasTailoredData: !!result.tailoredResume,
        variantId: result.variantId
      })
      
      suggestionManager.loadSuggestions(
        result.suggestions || [],
        result.tailoredResume,
        result.variantId
      )

      console.log(`✅ Analysis complete: ${result.suggestions?.length || 0} suggestions`)
      console.log('🔍 Suggestion breakdown:', result.suggestions.map(s => ({
        id: s.id,
        section: s.section,
        type: s.suggestion_type,
        before: s.before?.substring(0, 50),
        after: s.after?.substring(0, 50)
      })))

    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }


  const handleRetryAnalysis = () => {
    setIsInitialized(false)
    setAnalysisError(null)
    // Will trigger re-initialization in the next useEffect cycle
  }

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    localStorage.setItem('selectedTemplate', template)
  }

  const handleOpenInEditor = () => {
    const currentData = suggestionManager.getCurrentData()
    const variantId = suggestionManager.getVariantId() // Get the actual variant ID
    
    if (currentData && variantId && onOpenInEditor) {
      onOpenInEditor(currentData, variantId)
    }
  }

  const stats = suggestionManager.getStats()

  return (
    <div className="w-full h-full flex flex-col min-h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Tailored Resume Preview</h2>
          
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}

          {stats.total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {stats.pending} suggestions
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Template Selector */}
          <select
            value={selectedTemplate}
            onChange={(e: any) => handleTemplateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="swiss">Swiss</option>
            <option value="professional">Professional</option>
            <option value="classic">Classic</option>
            <option value="impact">Impact</option>
          </select>

          {analysisError && (
            <button
              onClick={handleRetryAnalysis}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          )}

          {!loading && suggestionManager.getCurrentData() && (
            <button
              onClick={handleOpenInEditor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Open in Editor
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {analysisError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-center">
            <div className="text-red-700">
              <strong>Analysis Failed:</strong> {analysisError}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex">
        {/* Base Resume (Left) */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Original Resume</span>
          </div>
          
          <div className="flex-1 relative">
            {basePreviewHtml ? (
              <iframe
                ref={baseIframeRef}
                srcDoc={basePreviewHtml}
                className="w-full h-full border-none"
                sandbox="allow-same-origin"
                title="Base Resume Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Tailored Resume (Right) */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border-b border-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Tailored Resume</span>
            {stats.accepted > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">{stats.accepted} applied</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            {tailoredPreviewHtml ? (
              <>
                <iframe
                  ref={tailoredIframeRef}
                  srcDoc={tailoredPreviewHtml}
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin"
                  title="Tailored Resume Preview"
                />
                
                {/* Suggestion Overlay */}
                <InlineSuggestionRenderer
                  iframeRef={tailoredIframeRef}
                  suggestions={suggestionManager.suggestions}
                  appliedSuggestions={suggestionManager.appliedSuggestions}
                  declinedSuggestions={suggestionManager.declinedSuggestions}
                  onAccept={suggestionManager.acceptSuggestion}
                  onDecline={suggestionManager.declineSuggestion}
                />
              </>
            ) : loading ? (
              <div className="flex items-center justify-center h-full text-blue-600">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Generating tailored resume...</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No tailored version available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}