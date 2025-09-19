/**
 * Unified Suggestions Hook
 * Manages suggestions for all resume sections with a consistent interface
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface UnifiedSuggestion {
  id: string
  variantId?: string
  section: 'title' | 'summary' | 'experience' | 'projects' | 'skills' | 'education'
  type: 'text' | 'bullet' | 'skill_add' | 'skill_remove' | 'enhancement'
  targetPath?: string // Path to the specific field/bullet
  targetIndex?: number // For array items
  original: string
  suggested: string
  rationale: string
  atsKeywords?: string[]
  confidence: number
  status: 'pending' | 'accepted' | 'declined'
  appliedAt?: string
}

export interface SuggestionGroup {
  section: string
  suggestions: UnifiedSuggestion[]
  acceptedCount: number
  pendingCount: number
}

interface UseUnifiedSuggestionsProps {
  mode: 'base' | 'tailor'
  variantId?: string
  jobId?: string
  baseResumeId?: string
  onDataChange?: (data: any) => void
}

export function useUnifiedSuggestions({
  mode,
  variantId,
  jobId,
  baseResumeId,
  onDataChange
}: UseUnifiedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<UnifiedSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appliedChanges = useRef(new Set<string>())

  // Normalize target paths like "experience[0].bullets[2]" → "experience.0.achievements.2"
  const canonicalizePath = (raw?: string | null): string | undefined => {
    if (!raw || typeof raw !== 'string') return undefined
    let p = raw
      .replace(/\[\s*(\d+)\s*\]/g, '.$1')
      .replace(/bullets/g, 'achievements')
      .replace(/\s+/g, '')
    // Convert underscore-delimited ids like experience_0_achievements_2
    p = p.replace(/^experience_(\d+)_achievements_(\d+)$/, 'experience.$1.achievements.$2')
    // Remove any trailing dots
    p = p.replace(/\.+$/,'')
    return p
  }
  
  // Load suggestions if in tailor mode
  useEffect(() => {
    console.log('🎯 useUnifiedSuggestions effect triggered', { mode, variantId })
    if (mode === 'tailor' && variantId) {
      console.log('✅ Loading suggestions for tailor mode with variant:', variantId)
      loadSuggestions()
    } else if (mode === 'base') {
      console.log('🔄 Base mode - clearing suggestions')
      // Clear suggestions in base mode
      setSuggestions([])
      appliedChanges.current.clear()
    } else {
      console.log('⚠️ Conditions not met for loading', { mode, variantId })
    }
  }, [mode, variantId])

  const loadSuggestions = async () => {
    if (!variantId) {
      console.log('⚠️ No variantId provided, skipping suggestion load')
      return
    }
    
    console.log('🔄 Loading suggestions for variant:', variantId)
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('resume_suggestions')
        .select('*')
        .eq('variant_id', variantId)
        .order('section', { ascending: true })
        .order('confidence', { ascending: false })
      
      if (error) {
        console.error('❌ Failed to load suggestions from database:', error)
        throw error
      }
      
      console.log(`📊 Raw suggestions from DB:`, data?.length || 0, 'suggestions')
      if (data && data.length > 0) {
        console.log('Sample suggestion:', data[0])
      }
      
      // Transform to our format
      const transformed: UnifiedSuggestion[] = (data || []).map(s => ({
        id: s.id,
        variantId: s.variant_id,
        section: (s.section === 'professionalSummary' ? 'summary' : s.section),
        type: (s.suggestion_type === 'skill_addition' ? 'skill_add' : s.suggestion_type === 'skill_removal' ? 'skill_remove' : (s.suggestion_type || 'enhancement')),
        targetPath: canonicalizePath((s as any).target_id || (s as any).target_path),
        original: s.original_content,
        suggested: s.suggested_content,
        rationale: s.rationale,
        atsKeywords: s.keywords || [],
        confidence: s.confidence,
        status: s.accepted === true ? 'accepted' : (s.accepted === false && s.applied_at ? 'declined' : 'pending'),
        appliedAt: s.applied_at
      }))

      // Observability: count missing anchors for experience
      const missingAnchors = transformed.filter(s => s.section === 'experience' && !s.targetPath)
      if (missingAnchors.length > 0) {
        console.warn('SUGGESTIONS_ANCHOR_MISS', { count: missingAnchors.length, example: missingAnchors[0] })
      }
      
      setSuggestions(transformed)
      
      // Track which ones are already applied
      transformed.forEach(s => {
        if (s.status === 'accepted') {
          appliedChanges.current.add(s.id)
        }
      })
      
      console.log(`📋 Loaded ${transformed.length} suggestions for variant ${variantId}`)
    } catch (err) {
      console.error('Failed to load suggestions:', err)
      setError('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return
    
    // Update status in state
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'accepted' as const, appliedAt: new Date().toISOString() }
        : s
    ))
    
    // Track the change
    appliedChanges.current.add(suggestionId)
    
    // Update in database if we have a variant
    if (variantId) {
      try {
        await supabase
          .from('resume_suggestions')
          .update({ 
            accepted: true,
            applied_at: new Date().toISOString()
          })
          .eq('id', suggestionId)
      } catch (error) {
        console.error('Failed to update suggestion status:', error)
      }
    }
    
    // Notify parent to update the actual data
    if (onDataChange) {
      onDataChange(suggestion)
    }
  }, [suggestions, variantId, onDataChange])

  const declineSuggestion = useCallback(async (suggestionId: string) => {
    // Update status in state
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'declined' as const }
        : s
    ))
    
    // Remove from applied changes
    appliedChanges.current.delete(suggestionId)
    
    // Update in database if we have a variant
    if (variantId) {
      try {
        await supabase
          .from('resume_suggestions')
          .update({ 
            accepted: false,
            applied_at: new Date().toISOString()
          })
          .eq('id', suggestionId)
      } catch (error) {
        console.error('Failed to update suggestion status:', error)
      }
    }
  }, [variantId])

  const getSuggestionsForSection = useCallback((section: string): UnifiedSuggestion[] => {
    return suggestions.filter(s => 
      s.section === section && s.status === 'pending'
    )
  }, [suggestions])

  const getSuggestionForField = useCallback((path: string): UnifiedSuggestion | undefined => {
    const canonical = canonicalizePath(path)
    return suggestions.find(s => 
      (s.status === 'pending') && (s.targetPath === canonical || s.targetPath?.startsWith(String(canonical)))
    )
  }, [suggestions])

  const getStats = useCallback(() => {
    const groups = new Map<string, SuggestionGroup>()
    
    suggestions.forEach(s => {
      if (!groups.has(s.section)) {
        groups.set(s.section, {
          section: s.section,
          suggestions: [],
          acceptedCount: 0,
          pendingCount: 0
        })
      }
      
      const group = groups.get(s.section)!
      group.suggestions.push(s)
      
      if (s.status === 'accepted') {
        group.acceptedCount++
      } else if (s.status === 'pending') {
        group.pendingCount++
      }
    })
    
    return {
      total: suggestions.length,
      accepted: suggestions.filter(s => s.status === 'accepted').length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      declined: suggestions.filter(s => s.status === 'declined').length,
      bySection: Array.from(groups.values())
    }
  }, [suggestions])

  const generateSuggestionsForSection = useCallback(async (
    section: string,
    currentContent: any,
    jobContext?: any
  ) => {
    if (mode !== 'tailor' || !jobId || !baseResumeId) {
      console.warn('Cannot generate suggestions outside of tailor mode')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Call API to generate suggestions for this section
      const response = await fetch('/api/suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          content: currentContent,
          jobId,
          baseResumeId,
          variantId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }
      
      const { suggestions: newSuggestions } = await response.json()
      
      // Merge with existing suggestions
      setSuggestions(prev => {
        // Remove old suggestions for this section
        const filtered = prev.filter(s => s.section !== section)
        // Add new ones
        return [...filtered, ...newSuggestions]
      })
      
      console.log(`✨ Generated ${newSuggestions.length} suggestions for ${section}`)
    } catch (err) {
      console.error('Failed to generate suggestions:', err)
      setError('Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }, [mode, jobId, baseResumeId, variantId])

  return {
    suggestions,
    loading,
    error,
    acceptSuggestion,
    declineSuggestion,
    getSuggestionsForSection,
    getSuggestionForField,
    getStats,
    generateSuggestionsForSection,
    isEnabled: mode === 'tailor',
    hasChanges: appliedChanges.current.size > 0
  }
}