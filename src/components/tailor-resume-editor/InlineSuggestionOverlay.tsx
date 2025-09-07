'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  X,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import type { ResumeSuggestion } from '@/lib/services/resumeVariantService'

interface InlineSuggestionOverlayProps {
  iframeRef: React.RefObject<HTMLIFrameElement>
  suggestions: ResumeSuggestion[]
  onAccept: (suggestionId: string) => void
  onDecline: (suggestionId: string) => void
  acceptedSuggestions: Set<string>
  declinedSuggestions: Set<string>
}

export function InlineSuggestionOverlay({
  iframeRef,
  suggestions,
  onAccept,
  onDecline,
  acceptedSuggestions,
  declinedSuggestions
}: InlineSuggestionOverlayProps) {
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null)
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null)
  const [showDebugList, setShowDebugList] = useState(false)

  // Check for debug mode on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowDebugList(localStorage.getItem('SHOW_LIST_DEBUG') === 'true')
    }
  }, [])

  // Inject inline chips with mini diffs
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !suggestions || suggestions.length === 0) return

    const injectOverlays = () => {
      const doc = iframe.contentDocument
      if (!doc) return

      // Clear previous overlays
      doc.querySelectorAll('[data-suggestion-overlay]').forEach(el => el.remove())

      // Style injection for overlays
      let styleEl = doc.getElementById('suggestion-overlay-styles')
      if (!styleEl) {
        styleEl = doc.createElement('style')
        styleEl.id = 'suggestion-overlay-styles'
        styleEl.textContent = `
          [data-suggestion-overlay] {
            position: absolute;
            top: 0;
            right: -8px;
            transform: translateX(100%);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .suggestion-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 6px;
            background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95));
            border: 1px solid rgba(16,185,129,0.6);
            border-radius: 12px;
            color: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
          }
          
          .suggestion-chip:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }
          
          .suggestion-diff {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 4px;
            min-width: 320px;
            max-width: 480px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            overflow: hidden;
            display: none;
          }
          
          .suggestion-chip.expanded .suggestion-diff {
            display: block;
          }
          
          .diff-header {
            padding: 8px 12px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
          }
          
          .diff-content {
            padding: 12px;
          }
          
          .diff-before, .diff-after {
            padding: 8px;
            border-radius: 4px;
            margin: 4px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
          }
          
          .diff-before {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
          }
          
          .diff-after {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            color: #166534;
          }
          
          .diff-rationale {
            margin-top: 8px;
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
            font-size: 11px;
            color: #6b7280;
            border-left: 3px solid #3b82f6;
          }
          
          .diff-actions {
            display: flex;
            gap: 8px;
            padding: 8px 12px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          
          .diff-btn {
            flex: 1;
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .diff-accept {
            background: #10b981;
            color: white;
          }
          
          .diff-accept:hover {
            background: #059669;
          }
          
          .diff-decline {
            background: #6b7280;
            color: white;
          }
          
          .diff-decline:hover {
            background: #4b5563;
          }
          
          .suggestion-accepted {
            background: linear-gradient(135deg, #10b981, #059669);
            opacity: 0.7;
            pointer-events: none;
          }
          
          .suggestion-declined {
            display: none;
          }
        `
        doc.head.appendChild(styleEl)
      }

      // Create overlay for each suggestion
      suggestions.forEach(suggestion => {
        // Skip if already processed
        if (acceptedSuggestions.has(suggestion.id) || declinedSuggestions.has(suggestion.id)) {
          return
        }

        // Find target element based on suggestion
        let targetElement: HTMLElement | null = null
        
        if (suggestion.section === 'summary') {
          // Find summary paragraph
          const paras = Array.from(doc.querySelectorAll('p, div')) as HTMLElement[]
          targetElement = paras.find(p => 
            p.textContent?.includes(suggestion.original_content.substring(0, 50))
          ) || null
        } else if (suggestion.section === 'experience' && suggestion.target_id) {
          // Find specific bullet point
          const bullets = Array.from(doc.querySelectorAll('li')) as HTMLElement[]
          const match = suggestion.target_id.match(/exp_(\d+)_bullet_(\d+)/)
          if (match) {
            const bulletIndex = parseInt(match[2])
            targetElement = bullets.find(b => 
              b.textContent?.includes(suggestion.original_content.substring(0, 40))
            ) || bullets[bulletIndex] || null
          }
        } else if (suggestion.section === 'skills') {
          // Find skills section
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          targetElement = headers.find(h => 
            /skills/i.test(h.textContent || '')
          ) as HTMLElement || null
        } else if (suggestion.section === 'languages') {
          // Find languages section
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          targetElement = headers.find(h => 
            /language/i.test(h.textContent || '')
          ) as HTMLElement || null
        }

        if (!targetElement) return

        // Make target element relative positioned
        targetElement.style.position = 'relative'

        // Create overlay container
        const overlay = doc.createElement('div')
        overlay.setAttribute('data-suggestion-overlay', suggestion.id)
        
        // Create chip
        const chip = doc.createElement('div')
        chip.className = 'suggestion-chip'
        chip.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>${getChipLabel(suggestion)}</span>
        `

        // Create diff panel
        const diffPanel = doc.createElement('div')
        diffPanel.className = 'suggestion-diff'
        diffPanel.innerHTML = `
          <div class="diff-header">
            ${getSuggestionTitle(suggestion)}
          </div>
          <div class="diff-content">
            <div class="diff-before">
              - ${suggestion.original_content}
            </div>
            <div class="diff-after">
              + ${suggestion.suggested_content}
            </div>
            ${suggestion.rationale ? `
              <div class="diff-rationale">
                <strong>Why:</strong> ${suggestion.rationale}
              </div>
            ` : ''}
          </div>
          <div class="diff-actions">
            <button class="diff-btn diff-accept" data-action="accept">
              ✓ Accept
            </button>
            <button class="diff-btn diff-decline" data-action="decline">
              ✗ Decline
            </button>
          </div>
        `

        overlay.appendChild(chip)
        overlay.appendChild(diffPanel)

        // Event handlers
        chip.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          chip.classList.toggle('expanded')
        }

        const acceptBtn = diffPanel.querySelector('[data-action="accept"]')
        const declineBtn = diffPanel.querySelector('[data-action="decline"]')

        if (acceptBtn) {
          acceptBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            onAccept(suggestion.id)
            overlay.remove()
          })
        }

        if (declineBtn) {
          declineBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            onDecline(suggestion.id)
            overlay.remove()
          })
        }

        targetElement.appendChild(overlay)
      })
    }

    // Inject with delay to ensure iframe is loaded
    const timer = setTimeout(injectOverlays, 500)
    return () => clearTimeout(timer)
  }, [iframeRef, suggestions, acceptedSuggestions, declinedSuggestions, onAccept, onDecline])

  // Debug list view (developer toggle)
  if (showDebugList) {
    return (
      <div className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Debug: Suggestions</h3>
          <button
            onClick={() => localStorage.removeItem('SHOW_LIST_DEBUG')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 space-y-2">
          {suggestions.map(s => (
            <div key={s.id} className="text-xs p-2 bg-gray-50 rounded">
              <div className="font-medium">{s.section} - {s.suggestion_type}</div>
              <div className="text-gray-600 truncate">{s.suggested_content}</div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => onAccept(s.id)}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecline(s.id)}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null // Overlays are injected directly into iframe
}

function getChipLabel(suggestion: ResumeSuggestion): string {
  const labels: Record<string, string> = {
    summary: 'Summary',
    experience: 'Bullet',
    skills: 'Skill',
    languages: 'Language',
    education: 'Education',
    projects: 'Project',
    certifications: 'Cert'
  }
  return labels[suggestion.section] || 'Suggestion'
}

function getSuggestionTitle(suggestion: ResumeSuggestion): string {
  const titles: Record<string, string> = {
    summary: 'Professional Summary Enhancement',
    experience: 'Experience Bullet Optimization',
    skills: 'Skills Update',
    languages: 'Language Proficiency',
    education: 'Education Detail',
    projects: 'Project Description',
    certifications: 'Certification Update'
  }
  return titles[suggestion.section] || 'Content Suggestion'
}