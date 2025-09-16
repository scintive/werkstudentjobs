/**
 * Suggestion Manager Hook
 * Single responsibility: Manage suggestion state and actions
 */

import { useState, useCallback, useRef } from 'react'
import { tailorAnalysisService } from '@/lib/services/tailorAnalysisService'

export interface Suggestion {
  id: string
  section: string
  suggestion_type: string
  target_path?: string
  before: string
  after: string
  rationale: string
  ats_keywords?: string[]
  confidence: number
  status?: 'pending' | 'accepted' | 'declined'
}

export interface SuggestionStats {
  total: number
  pending: number
  accepted: number
  declined: number
}

export function useSuggestionManager() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set<string>())
  const [declinedSuggestions, setDeclinedSuggestions] = useState(new Set<string>())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track current variant data for optimistic updates
  const currentVariantData = useRef<any>(null)
  const variantId = useRef<string | null>(null)

  const loadSuggestions = useCallback((newSuggestions: Suggestion[], tailoredData: any, vId: string) => {
    console.log('📥 Loading suggestions into manager:', {
      suggestionsCount: newSuggestions.length,
      variantId: vId,
      tailoredDataKeys: Object.keys(tailoredData || {}),
      tailoredDataSample: {
        name: tailoredData?.personalInfo?.name,
        title: tailoredData?.professionalTitle,
        summary: tailoredData?.professionalSummary?.substring(0, 50),
        skillsKeys: Object.keys(tailoredData?.skills || {})
      }
    })
    
    setSuggestions(newSuggestions)
    currentVariantData.current = tailoredData
    variantId.current = vId
    
    // Load existing applied/declined states
    const applied = new Set<string>()
    const declined = new Set<string>()
    
    newSuggestions.forEach(s => {
      if (s.status === 'accepted') applied.add(s.id)
      if (s.status === 'declined') declined.add(s.id)
    })
    
    setAppliedSuggestions(applied)
    setDeclinedSuggestions(declined)
    setError(null)
    
    console.log('✅ Suggestions loaded successfully:', {
      total: newSuggestions.length,
      applied: applied.size,
      declined: declined.size
    })
  }, [])

  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion || !currentVariantData.current || !variantId.current) return

    setLoading(true)
    setError(null)

    try {
      // Optimistic update
      setAppliedSuggestions(prev => new Set([...prev, suggestionId]))
      setDeclinedSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })

      // Apply suggestion to variant data
      const updatedData = applySuggestionToData(currentVariantData.current, suggestion)
      currentVariantData.current = updatedData

      // Persist to backend
      await Promise.all([
        tailorAnalysisService.applySuggestion(suggestionId, 'accept'),
        tailorAnalysisService.updateVariant(variantId.current, updatedData)
      ])

    } catch (err) {
      // Revert optimistic update on error
      setAppliedSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })
      setError(err instanceof Error ? err.message : 'Failed to accept suggestion')
    } finally {
      setLoading(false)
    }
  }, [suggestions])

  const declineSuggestion = useCallback(async (suggestionId: string) => {
    setLoading(true)
    setError(null)

    try {
      // Optimistic update
      setDeclinedSuggestions(prev => new Set([...prev, suggestionId]))
      setAppliedSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })

      // Persist to backend
      await tailorAnalysisService.applySuggestion(suggestionId, 'decline')

    } catch (err) {
      // Revert optimistic update on error
      setDeclinedSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })
      setError(err instanceof Error ? err.message : 'Failed to decline suggestion')
    } finally {
      setLoading(false)
    }
  }, [])

  const getStats = useCallback((): SuggestionStats => {
    return {
      total: suggestions.length,
      pending: suggestions.length - appliedSuggestions.size - declinedSuggestions.size,
      accepted: appliedSuggestions.size,
      declined: declinedSuggestions.size
    }
  }, [suggestions.length, appliedSuggestions.size, declinedSuggestions.size])

  const getActiveSuggestions = useCallback(() => {
    return suggestions.filter(s => 
      !appliedSuggestions.has(s.id) && !declinedSuggestions.has(s.id)
    )
  }, [suggestions, appliedSuggestions, declinedSuggestions])

  const getCurrentData = useCallback(() => {
    return currentVariantData.current
  }, [suggestions]) // Only update when suggestions change, not on every render

  const getVariantId = useCallback(() => {
    return variantId.current
  }, [])

  return {
    suggestions,
    appliedSuggestions,
    declinedSuggestions,
    loading,
    error,
    loadSuggestions,
    acceptSuggestion,
    declineSuggestion,
    getStats,
    getActiveSuggestions,
    getCurrentData,
    getVariantId
  }
}

/**
 * Apply a suggestion to resume data
 * Pure function that doesn't mutate original data
 */
function applySuggestionToData(data: any, suggestion: Suggestion): any {
  const newData = JSON.parse(JSON.stringify(data)) // Deep clone

  try {
    if (suggestion.target_path) {
      // Use target_path for precise updates
      applyByTargetPath(newData, suggestion.target_path, suggestion.after)
    } else {
      // Fallback to section-based updates
      applyBySection(newData, suggestion)
    }
  } catch (error) {
    console.error('Error applying suggestion:', error)
  }

  return newData
}

function applyByTargetPath(data: any, targetPath: string, newValue: string): void {
  const parts = targetPath.split('.')
  let current = data

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const arrayMatch = part.match(/(\w+)\[(\d+)\]/)
    
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch
      current = current[arrayName][parseInt(index)]
    } else {
      current = current[part]
    }
  }

  const lastPart = parts[parts.length - 1]
  const arrayMatch = lastPart.match(/(\w+)\[(\d+)\]/)
  
  if (arrayMatch) {
    const [, arrayName, index] = arrayMatch
    current[arrayName][parseInt(index)] = newValue
  } else {
    current[lastPart] = newValue
  }
}

function applyBySection(data: any, suggestion: Suggestion): void {
  switch (suggestion.section) {
    case 'summary':
      data.professionalSummary = suggestion.after
      break
    case 'title':
      data.professionalTitle = suggestion.after
      break
    case 'skills':
      if (suggestion.suggestion_type === 'skill_addition') {
        // Add skill to appropriate category
        const category = 'technical' // Default category
        if (!data.skills[category]) data.skills[category] = []
        data.skills[category].push(suggestion.after)
      } else if (suggestion.suggestion_type === 'skill_removal') {
        // Remove skill from all categories
        Object.keys(data.skills).forEach(category => {
          data.skills[category] = data.skills[category].filter((skill: string) => 
            skill !== suggestion.before
          )
        })
      }
      break
    default:
      console.warn('Unhandled suggestion section:', suggestion.section)
  }
}