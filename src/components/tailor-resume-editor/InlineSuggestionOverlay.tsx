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
  appliedSuggestions: Set<string>
  declinedSuggestions: Set<string>
  appliedHighlights?: Set<string>
  onHighlightChange?: (highlights: Set<string>) => void
}

export function InlineSuggestionOverlay({
  iframeRef,
  suggestions,
  onAccept,
  onDecline,
  appliedSuggestions,
  declinedSuggestions,
  appliedHighlights = new Set(),
  onHighlightChange
}: InlineSuggestionOverlayProps) {
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null)
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null)
  const [showDebugList, setShowDebugList] = useState(false)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [localHighlights, setLocalHighlights] = useState<Set<string>>(new Set())

  // Filter active suggestions (not accepted/declined)
  const activeSuggestions = suggestions.filter(s =>
    !appliedSuggestions.has(s.id) && !declinedSuggestions.has(s.id)
  )
  
  // Debug logging
  React.useEffect(() => {
    console.log('🎯 InlineSuggestionOverlay:', {
      totalSuggestions: suggestions.length,
      activeSuggestions: activeSuggestions.length,
      applied: appliedSuggestions.size,
      declined: declinedSuggestions.size,
      iframeReady: !!iframeRef.current
    })
  }, [suggestions, activeSuggestions, appliedSuggestions, declinedSuggestions])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSuggestions.length === 0) return

      if (e.key === 'A' || e.key === 'a') {
        e.preventDefault()
        const currentSuggestion = activeSuggestions[currentSuggestionIndex]
        if (currentSuggestion) {
          onAccept(currentSuggestion.id)
          // Add highlight effect
          if (onHighlightChange) {
            const newHighlights = new Set(appliedHighlights)
            newHighlights.add(currentSuggestion.id)
            onHighlightChange(newHighlights)
            setTimeout(() => {
              const updatedHighlights = new Set(appliedHighlights)
              updatedHighlights.delete(currentSuggestion.id)
              onHighlightChange(updatedHighlights)
            }, 1000)
          }
        }
      } else if (e.key === 'X' || e.key === 'x') {
        e.preventDefault()
        const currentSuggestion = activeSuggestions[currentSuggestionIndex]
        if (currentSuggestion) {
          onDecline(currentSuggestion.id)
        }
      } else if (e.key === 'J' || e.key === 'j') {
        e.preventDefault()
        setCurrentSuggestionIndex(prev =>
          prev < activeSuggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'K' || e.key === 'k') {
        e.preventDefault()
        setCurrentSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : activeSuggestions.length - 1
        )
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeSuggestions, currentSuggestionIndex, onAccept, onDecline])

  // Check for debug mode on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowDebugList(localStorage.getItem('SHOW_LIST_DEBUG') === 'true')
    }
  }, [])

  // Inject inline chips with mini diffs
  useEffect(() => {
    const iframe = iframeRef.current
    console.log('💉 InlineSuggestionOverlay: Injection attempt', {
      hasIframe: !!iframe,
      suggestionsCount: suggestions?.length || 0,
      suggestions: suggestions
    })
    if (!iframe || !suggestions || suggestions.length === 0) return

    const injectOverlays = () => {
      const doc = iframe.contentDocument
      if (!doc) {
        console.warn('💉 InlineSuggestionOverlay: No iframe document available')
        return
      }
      console.log('💉 InlineSuggestionOverlay: Injecting overlays into iframe')

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
            gap: 6px;
            padding: 4px 8px;
            background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95));
            border: 1px solid rgba(16,185,129,0.6);
            border-radius: 16px;
            color: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            backdrop-filter: blur(8px);
            transition: all 0.15s ease-out;
            position: relative;
            font-size: 12px;
            font-weight: 500;
            animation: chip-appear 0.2s ease-out;
          }

          .chip-content {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .chip-icon {
            font-size: 10px;
            font-weight: bold;
            opacity: 0.9;
          }

          .chip-label {
            font-size: 11px;
            white-space: nowrap;
          }

          .keyboard-hint {
            font-size: 9px;
            opacity: 0.8;
            background: rgba(255,255,255,0.2);
            padding: 1px 3px;
            border-radius: 4px;
            margin-left: 2px;
          }

          @keyframes chip-appear {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Skill-specific chip styles */
          .skill-chip.skill-skill_addition {
            background: linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95));
            border-color: rgba(34,197,94,0.6);
          }

          .skill-chip.skill-skill_removal {
            background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95));
            border-color: rgba(239,68,68,0.6);
          }

          .skill-chip.skill-skill_edit,
          .skill-chip.skill-alias {
            background: linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95));
            border-color: rgba(59,130,246,0.6);
          }

          .skill-chip.skill-reorder {
            background: linear-gradient(135deg, rgba(168,85,247,0.95), rgba(147,51,234,0.95));
            border-color: rgba(168,85,247,0.6);
          }

          .suggestion-chip:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }

          .suggestion-chip.current {
            background: linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95));
            border-color: rgba(59,130,246,0.6);
            box-shadow: 0 4px 16px rgba(59,130,246,0.3);
          }

          .suggestion-chip.current::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid rgba(59,130,246,0.8);
            border-radius: 14px;
            animation: pulse 2s infinite;
          }

          .ghost-underline {
            background: linear-gradient(90deg,
              transparent 0%,
              rgba(59,130,246,0.3) 20%,
              rgba(59,130,246,0.3) 80%,
              transparent 100%);
            animation: fade-ghost 3s ease-out forwards;
          }

          .applied-highlight {
            background: linear-gradient(90deg,
              transparent 0%,
              rgba(16,185,129,0.2) 20%,
              rgba(16,185,129,0.2) 80%,
              transparent 100%);
            animation: applied-flash 1s ease-out forwards;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes fade-ghost {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }

          @keyframes applied-flash {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
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

          .diff-summary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
          }

          .diff-arrow {
            color: #64748b;
            font-size: 14px;
          }

          .diff-before, .diff-after {
            padding: 8px;
            border-radius: 6px;
            margin: 4px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
            position: relative;
          }

          .diff-before {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
          }

          .diff-after {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
          }

          /* Highlight effect for accepted changes */
          .accepted-highlight {
            background: linear-gradient(90deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1));
            animation: highlight-fade 1s ease-out forwards;
          }

          @keyframes highlight-fade {
            0% {
              background: linear-gradient(90deg, rgba(34,197,94,0.6), rgba(34,197,94,0.2));
            }
            100% {
              background: transparent;
            }
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
        if (appliedSuggestions.has(suggestion.id) || declinedSuggestions.has(suggestion.id)) {
          return
        }

        // Find target element based on suggestion
        let targetElement: HTMLElement | null = null
        const path = suggestion.target_id || ''
        // Direct data-path anchor (preferred)
        if (path && path.includes('[') && path.includes(']')) {
          const el = doc.querySelector(`[data-path="${path}"]`) as HTMLElement | null
          if (el) targetElement = el
        }
        
        if (!targetElement && suggestion.section === 'summary') {
          // Find summary paragraph
          const paras = Array.from(doc.querySelectorAll('p, div')) as HTMLElement[]
          targetElement = paras.find(p => 
            p.textContent?.includes(suggestion.original_content.substring(0, 50))
          ) || null
        } else if (!targetElement && suggestion.section === 'title') {
          // Professional title element in templates
          targetElement = (doc.querySelector('.title') as HTMLElement) || null
        } else if (!targetElement && suggestion.section === 'experience' && suggestion.target_id) {
          // Find specific bullet point
          const bullets = Array.from(doc.querySelectorAll('li[data-section="experience"], li')) as HTMLElement[]
          const match = suggestion.target_id.match(/exp_(\d+)_bullet_(\d+)/)
          if (match) {
            const bulletIndex = parseInt(match[2])
            targetElement = bullets.find(b => 
              b.textContent?.includes(suggestion.original_content.substring(0, 40))
            ) || bullets[bulletIndex] || null
          }
        } else if (!targetElement && suggestion.section === 'skills') {
          // Anchor by skill group + index for precise targeting
          if (suggestion.target_id) {
            // Try path format: skills.category[index]
            let category: string | null = null
            let index: number | null = null
            const m = suggestion.target_id.match(/skills\.([^.\[]+)\[(\d+)\]/)
            if (m) { category = m[1]; index = parseInt(m[2]) }
            else {
              const parts = suggestion.target_id.split('_')
              category = parts[0] || null
              index = parts[1] ? parseInt(parts[1]) : null
            }

            // Find skills section first
            const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
            const skillsHeader = headers.find(h =>
              /skills/i.test(h.textContent || '')
            ) as HTMLElement

            if (skillsHeader) {
              // Look for skill tags in the skills section
              // Try to find elements that might contain individual skills
              const skillElements = Array.from(skillsHeader.parentElement?.querySelectorAll('[data-section="skills"], span, div, li') || [])
              const skillTags = skillElements.filter(el =>
                el.textContent?.trim() &&
                el.textContent?.trim() === suggestion.original_content?.trim()
              )

              if (index != null && skillTags[index]) {
                targetElement = skillTags[index] as HTMLElement
              } else if (skillTags.length > 0) {
                targetElement = skillTags[0] as HTMLElement
              } else {
                targetElement = skillsHeader
              }
            }
          } else {
            // Fallback: find skills section header
            const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
            targetElement = headers.find(h =>
              /skills/i.test(h.textContent || '')
            ) as HTMLElement || null
          }
        } else if (!targetElement && suggestion.section === 'languages') {
          // Find languages section
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          targetElement = headers.find(h => 
            /language/i.test(h.textContent || '')
          ) as HTMLElement || null
        } else if (!targetElement && suggestion.section === 'projects') {
          // Anchor near Projects header or first matching project item
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          const projectsHeader = headers.find(h => /projects?/i.test(h.textContent || '')) as HTMLElement
          if (suggestion.original_content) {
            const elems = Array.from(doc.querySelectorAll('.project-item, li, p, div')) as HTMLElement[]
            targetElement = elems.find(el => el.textContent?.includes(suggestion.original_content!.substring(0, 50))) || projectsHeader || null
          } else {
            targetElement = projectsHeader || null
          }
        } else if (!targetElement && suggestion.section === 'education') {
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          const eduHeader = headers.find(h => /education/i.test(h.textContent || '')) as HTMLElement
          if (suggestion.original_content) {
            const elems = Array.from(doc.querySelectorAll('.education-item, li, p, div')) as HTMLElement[]
            targetElement = elems.find(el => el.textContent?.includes(suggestion.original_content!.substring(0, 50))) || eduHeader || null
          } else {
            targetElement = eduHeader || null
          }
        } else if (!targetElement && suggestion.section === 'certifications') {
          const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong'))
          const certHeader = headers.find(h => /certifications?/i.test(h.textContent || '')) as HTMLElement
          if (suggestion.original_content) {
            const elems = Array.from(doc.querySelectorAll('.certification-item, li, p, div')) as HTMLElement[]
            targetElement = elems.find(el => el.textContent?.includes(suggestion.original_content!.substring(0, 50))) || certHeader || null
          } else {
            targetElement = certHeader || null
          }
        } else if (!targetElement && suggestion.section === 'custom_sections') {
          // Fallback: try to match text anywhere
          if (suggestion.original_content) {
            const elems = Array.from(doc.querySelectorAll('p, li, div, span, strong')) as HTMLElement[]
            targetElement = elems.find(el => el.textContent?.includes(suggestion.original_content!.substring(0, 50))) || null
          }
        }

        if (!targetElement) return

        // Make target element relative positioned
        targetElement.style.position = 'relative'

        // Create overlay container
        const overlay = doc.createElement('div')
        overlay.setAttribute('data-suggestion-overlay', suggestion.id)
        
        // Create chip
        const chip = doc.createElement('div')
        const isCurrent = activeSuggestions[currentSuggestionIndex]?.id === suggestion.id
        chip.className = `suggestion-chip ${isCurrent ? 'current' : ''} ${suggestion.section === 'skills' ? `skill-chip skill-${suggestion.suggestion_type}` : ''}`
        chip.innerHTML = `
          <div class="chip-content">
            <div class="chip-icon">
              ${getChipIcon(suggestion)}
            </div>
            <span class="chip-label">${getChipLabel(suggestion)}</span>
            ${isCurrent ? '<div class="keyboard-hint">A/X</div>' : ''}
          </div>
        `

        // Create diff panel
        const diffPanel = doc.createElement('div')
        diffPanel.className = 'suggestion-diff'
        diffPanel.innerHTML = `
          <div class="diff-header">
            ${getSuggestionTitle(suggestion)}
          </div>
          <div class="diff-content">
            ${suggestion.diff_html ? `
              <div class="diff-html" style="padding: 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 12px;">
                ${suggestion.diff_html}
              </div>
            ` : `
              <div class="diff-summary">
                <span class="diff-original">${getDiffOriginal(suggestion)}</span>
                <span class="diff-arrow">${getDiffArrow(suggestion)}</span>
                <span class="diff-suggested">${getDiffSuggested(suggestion)}</span>
              </div>
            `}
            <div class="diff-before">
              <strong>Before:</strong><br>
              ${suggestion.before || suggestion.original_content}
            </div>
            <div class="diff-after">
              <strong>After:</strong><br>
              ${suggestion.after || suggestion.suggested_content}
            </div>
            ${suggestion.rationale ? `
              <div class="diff-rationale">
                <strong>Why:</strong> ${suggestion.rationale}
                ${suggestion.ats_keywords?.length ? `<br><strong>ATS:</strong> ${suggestion.ats_keywords.join(', ')}` : ''}
              </div>
            ` : ''}
            ${suggestion.resume_evidence ? `
              <div class="diff-evidence" style="margin-top: 8px; padding: 8px; background: #e0f2fe; border-radius: 4px; font-size: 11px; color: #0369a1;">
                <strong>Evidence:</strong> ${suggestion.resume_evidence}
              </div>
            ` : ''}
            ${suggestion.job_requirement ? `
              <div class="diff-requirement" style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 4px; font-size: 11px; color: #92400e;">
                <strong>Job Requirement:</strong> ${suggestion.job_requirement}
              </div>
            ` : ''}
          </div>
          <div class="diff-actions">
            <button class="diff-btn diff-accept" data-action="accept" data-suggestion-id="${suggestion.id}">
              ✓ Accept (A)
            </button>
            <button class="diff-btn diff-decline" data-action="decline" data-suggestion-id="${suggestion.id}">
              ✗ Decline (X)
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

            // Add ghost underline effect
            if (targetElement) {
              targetElement.classList.add('ghost-underline')
            }

            // Add applied highlight effect
            setAppliedHighlights(prev => new Set([...prev, suggestion.id]))
            setTimeout(() => {
              setAppliedHighlights(prev => {
                const next = new Set(prev)
                next.delete(suggestion.id)
                return next
              })
            }, 1000)

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
  }, [iframeRef, suggestions, appliedSuggestions, declinedSuggestions, onAccept, onDecline, currentSuggestionIndex, activeSuggestions, appliedHighlights, onHighlightChange])

  // Apply highlight effects to accepted suggestions
  React.useEffect(() => {
    if (!iframeRef.current || appliedHighlights.size === 0) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    // Remove existing highlights
    doc.querySelectorAll('.accepted-highlight').forEach(el => {
      el.classList.remove('accepted-highlight')
    })

    // Apply new highlights
    appliedHighlights.forEach(suggestionId => {
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (!suggestion) return

      // Find elements that contain the suggested content and highlight them
      const elements = Array.from(doc.querySelectorAll('*')) as HTMLElement[]
      elements.forEach(element => {
        if (element.textContent?.includes(suggestion.suggested_content)) {
          element.classList.add('accepted-highlight')
        }
      })
    })
  }, [iframeRef, appliedHighlights, suggestions])

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
  if (suggestion.section === 'skills') {
    switch (suggestion.suggestion_type) {
      case 'skill_addition':
        return `+ ${suggestion.suggested_content?.split(',')[0]?.trim() || 'New Skill'}`
      case 'skill_removal':
        return `- ${suggestion.original_content || 'Remove Skill'}`
      case 'skill_edit':
      case 'alias':
        const original = suggestion.original_content || 'Old'
        const suggested = suggestion.suggested_content || 'New'
        return `${original} → ${suggested}`
      case 'reorder':
        return '↕ Reorder Skills'
      default:
        return 'Skill Update'
    }
  }

  const labels: Record<string, string> = {
    summary: 'Summary',
    experience: 'Bullet',
    languages: 'Language',
    education: 'Education',
    projects: 'Project',
    certifications: 'Cert'
  }
  return labels[suggestion.section] || 'Suggestion'
}

function getChipIcon(suggestion: ResumeSuggestion): string {
  const icons: Record<string, string> = {
    summary: '✨',
    experience: '💼',
    skills: getSkillIcon(suggestion),
    languages: '🌍',
    education: '🎓',
    projects: '🚀',
    certifications: '🏆'
  }
  return icons[suggestion.section] || '💡'
}

function getSkillIcon(suggestion: ResumeSuggestion): string {
  switch (suggestion.suggestion_type) {
    case 'skill_addition':
      return '+'
    case 'skill_removal':
      return '−'
    case 'skill_edit':
    case 'alias':
      return '↔'
    case 'reorder':
      return '↕'
    default:
      return '⚡'
  }
}

function getDiffOriginal(suggestion: ResumeSuggestion): string {
  if (suggestion.section === 'skills' && suggestion.suggestion_type === 'skill_removal') {
    return suggestion.original_content || 'Remove'
  }
  return suggestion.original_content || 'Current'
}

function getDiffSuggested(suggestion: ResumeSuggestion): string {
  if (suggestion.section === 'skills' && suggestion.suggestion_type === 'skill_removal') {
    return 'Remove'
  }
  return suggestion.suggested_content || 'Suggested'
}

function getDiffArrow(suggestion: ResumeSuggestion): string {
  if (suggestion.section === 'skills') {
    switch (suggestion.suggestion_type) {
      case 'skill_addition':
        return '➕'
      case 'skill_removal':
        return '➖'
      case 'skill_edit':
      case 'alias':
        return '↔️'
      case 'reorder':
        return '↕️'
      default:
        return '→'
    }
  }
  return '→'
}

function getSuggestionTitle(suggestion: ResumeSuggestion): string {
  if (suggestion.section === 'skills') {
    switch (suggestion.suggestion_type) {
      case 'skill_addition':
        return `Add New Skill: ${suggestion.suggested_content?.split(',')[0]?.trim() || 'Skill'}`
      case 'skill_removal':
        return `Remove Skill: ${suggestion.original_content || 'Skill'}`
      case 'skill_edit':
        return `Edit Skill: ${suggestion.original_content || ''} → ${suggestion.suggested_content || ''}`
      case 'alias':
        return `Alias Skill: ${suggestion.original_content || ''} → ${suggestion.suggested_content || ''}`
      case 'reorder':
        return 'Reorder Skills'
      default:
        return 'Skills Update'
    }
  }

  const titles: Record<string, string> = {
    summary: 'Professional Summary Enhancement',
    experience: 'Experience Bullet Optimization',
    languages: 'Language Proficiency',
    education: 'Education Detail',
    projects: 'Project Description',
    certifications: 'Certification Update'
  }
  return titles[suggestion.section] || 'Content Suggestion'
}
