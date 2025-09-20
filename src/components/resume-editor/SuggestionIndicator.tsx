/**
 * Suggestion Indicator Component
 * Shows inline suggestions similar to the skills suggestion UI
 */

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, Check, X, Lightbulb } from 'lucide-react'
import { UnifiedSuggestion } from '@/hooks/useUnifiedSuggestions'

interface SuggestionIndicatorProps {
  suggestion: UnifiedSuggestion
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  compact?: boolean
  className?: string
}

export function SuggestionIndicator({
  suggestion,
  onAccept,
  onDecline,
  compact = false,
  className = ''
}: SuggestionIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Position the floating card using a portal to avoid clipping/overflow issues
  useEffect(() => {
    if (!isExpanded || !buttonRef.current) return
    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isExpanded])
  
  if (compact) {
    // Inline chip style for skills or short text
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs ${className}`}>
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span className="text-amber-700 font-medium truncate max-w-[150px]">
          {suggestion.suggested}
        </span>
        <button
          onClick={() => onAccept(suggestion.id)}
          className="ml-1 p-0.5 hover:bg-green-100 rounded-full transition-colors"
          title="Accept suggestion"
        >
          <Check className="w-3 h-3 text-green-600" />
        </button>
        <button
          onClick={() => onDecline(suggestion.id)}
          className="ml-0.5 p-0.5 hover:bg-red-100 rounded-full transition-colors"
          title="Decline suggestion"
        >
          <X className="w-3 h-3 text-red-600" />
        </button>
      </div>
    )
  }
  
  // Full suggestion card for longer content
  return (
    <div className={`relative ${className}`}>
      {/* Suggestion trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors"
      >
        <Lightbulb className="w-4 h-4 text-amber-600" />
        <span className="text-sm text-amber-700 font-medium">
          {suggestion.type === 'skill_add' || suggestion.type === 'skill_addition' ? 'Add skill' : 
           suggestion.type === 'skill_remove' || suggestion.type === 'skill_removal' ? 'Remove skill' :
           suggestion.section === 'title' ? 'Title suggestion' :
           suggestion.section === 'summary' ? 'Summary suggestion' :
           suggestion.section === 'experience' ? 'Experience suggestion' :
           suggestion.section === 'projects' ? 'Project suggestion' :
           suggestion.section === 'skills' ? 'Skills suggestion' :
           'Suggestion available'}
        </span>
        <span className="text-xs text-amber-600 bg-amber-200 px-1.5 py-0.5 rounded-full">
          {Math.round(suggestion.confidence)}%
        </span>
      </button>
      
      {/* Expanded suggestion card via portal */}
      {isExpanded && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] p-4 bg-white border border-amber-200 rounded-lg shadow-lg w-80"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="space-y-3">
            {/* Before/After comparison */}
            {(suggestion.original || suggestion.suggested) && (
              <div className="space-y-2">
                {suggestion.original && (
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-1">Current:</p>
                    <p className="text-sm text-red-800 line-through">{suggestion.original}</p>
                  </div>
                )}
                {suggestion.suggested && (
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Suggested:</p>
                    <p className="text-sm text-green-800">{suggestion.suggested}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Rationale */}
            {suggestion.rationale && (
              <div className="text-sm text-gray-600 italic">
                💡 {suggestion.rationale}
              </div>
            )}
            
            {/* ATS Keywords */}
            {suggestion.atsKeywords && suggestion.atsKeywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">ATS Keywords:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.atsKeywords.map((keyword, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  onAccept(suggestion.id)
                  setIsExpanded(false)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => {
                  onDecline(suggestion.id)
                  setIsExpanded(false)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

interface SuggestionBadgeProps {
  count: number
  section: string
  onClick?: () => void
}

export function SuggestionBadge({ count, section, onClick }: SuggestionBadgeProps) {
  if (count === 0) return null
  
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full transition-colors"
      title={`${count} suggestions for ${section}`}
    >
      <Sparkles className="w-3 h-3 text-amber-600" />
      <span className="text-xs font-medium text-amber-700">{count}</span>
    </button>
  )
}