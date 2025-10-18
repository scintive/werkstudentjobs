/**
 * Inline Suggestion Renderer Component
 * Injects Grammarly-style inline suggestions into the resume preview iframe
 */

import { useEffect, useRef, useCallback } from 'react'

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
}

interface InlineSuggestionRendererProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  suggestions: Suggestion[]
  appliedSuggestions: Set<string>
  declinedSuggestions: Set<string>
  onAccept: (suggestionId: string) => void
  onDecline: (suggestionId: string) => void
}

export function InlineSuggestionRenderer({
  iframeRef,
  suggestions,
  appliedSuggestions,
  declinedSuggestions,
  onAccept,
  onDecline
}: InlineSuggestionRendererProps) {
  const suggestionRefs = useRef<{ [key: string]: HTMLElement }>({})

  // Inject suggestions whenever they change
  useEffect(() => {
    const injectSuggestions = () => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) {
        console.log('⚠️ Iframe content document not ready')
        return false
      }

      const doc = iframe.contentDocument

      // Check if content is actually loaded
      const bodyContent = doc.body?.innerHTML
      if (!bodyContent || bodyContent.trim().length < 100) {
        console.log('⚠️ Iframe content not fully loaded yet')
        return false
      }

      // Clear existing suggestions
      doc.querySelectorAll('.grammarly-suggestion').forEach(el => el.remove())
      suggestionRefs.current = {}

      // Filter active suggestions
      const activeSuggestions = suggestions.filter(s => 
        !appliedSuggestions.has(s.id) && !declinedSuggestions.has(s.id)
      )

      console.log(`🎯 Injecting ${activeSuggestions.length} Grammarly-style suggestions`)
      console.log('📝 Active suggestions to inject:', activeSuggestions.map(s => ({
        id: s.id,
        section: s.section,
        before: s.before?.substring(0, 30),
        after: s.after?.substring(0, 30)
      })))

      // Inject each suggestion
      let injectedCount = 0
      activeSuggestions.forEach(suggestion => {
        const targetElement = findTargetElement(doc, suggestion)
        if (targetElement) {
          console.log(`✅ Found target for suggestion ${suggestion.id} in section ${suggestion.section}`)
          injectGrammarlySuggestion(targetElement, suggestion, doc)
          injectedCount++
        } else {
          console.warn(`❌ Could not find target for suggestion ${suggestion.id} in section ${suggestion.section}`, {
            searchText: suggestion.before?.substring(0, 50)
          })
        }
      })
      
      console.log(`💉 Successfully injected ${injectedCount}/${activeSuggestions.length} suggestions`)

      return true
    }

    // Retry logic for iframe loading
    const tryInject = () => {
      if (!injectSuggestions()) {
        // Retry after a short delay if content not ready
        setTimeout(tryInject, 100)
      }
    }

    // Try to inject immediately
    tryInject()

    // Also inject after iframe loads
    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener('load', tryInject)
      return () => iframe.removeEventListener('load', tryInject)
    }
  }, [suggestions, appliedSuggestions, declinedSuggestions])

  const findTargetElement = useCallback((doc: Document, suggestion: Suggestion): Element | null => {
    // Clean and normalize the search text
    const searchText = suggestion.before?.trim()
    if (!searchText) {
      console.log('⚠️ No search text for suggestion')
      return null
    }
    
    // Try to find the element containing the original text
    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    let node
    while (node = walker.nextNode()) {
      const nodeText = node.textContent?.trim()
      if (nodeText && nodeText.includes(searchText)) {
        console.log(`🔍 Found text match for "${searchText.substring(0, 30)}..." in element:`, node.parentElement?.tagName)
        return node.parentElement
      }
    }
    
    // Try partial match for longer text (first 50 chars)
    const partialSearch = searchText.substring(0, 50)
    const walker2 = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    while (node = walker2.nextNode()) {
      const nodeText = node.textContent?.trim()
      if (nodeText && nodeText.includes(partialSearch)) {
        console.log(`🔍 Found partial match for "${partialSearch}..." in element:`, node.parentElement?.tagName)
        return node.parentElement
      }
    }

    // Fallback to section-based targeting
    switch (suggestion.section) {
      case 'summary':
        return doc.querySelector('.professional-summary, .summary-text, [data-section="summary"]')
      case 'title':
        return doc.querySelector('.professional-title, .title, [data-section="title"]')
      case 'experience':
        // Look for the specific experience bullet
        const bullets = doc.querySelectorAll('.achievement, .bullet, li')
        for (const bullet of bullets) {
          if (bullet.textContent?.includes(suggestion.before.substring(0, 20))) {
            return bullet as Element
          }
        }
        return null
      case 'skills':
        const skills = doc.querySelectorAll('.skill-item, .skill')
        for (const skill of skills) {
          if (skill.textContent?.includes(suggestion.before)) {
            return skill as Element
          }
        }
        return null
      default:
        return null
    }
  }, [])

  const injectGrammarlySuggestion = useCallback((targetElement: Element, suggestion: Suggestion, doc: Document) => {
    // Don't process if already has a suggestion
    if (targetElement.querySelector('.grammarly-suggestion')) {
      return
    }

    const originalText = targetElement.textContent || ''
    
    // Create wrapper for the entire element
    const wrapper = doc.createElement('span')
    wrapper.className = 'grammarly-wrapper'
    wrapper.style.cssText = `
      position: relative;
      display: inline;
    `

    // Create the suggestion highlight
    const highlight = doc.createElement('span')
    highlight.className = 'grammarly-suggestion'
    highlight.dataset.suggestionId = suggestion.id
    highlight.style.cssText = `
      background: linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.3));
      border-bottom: 2px dotted #f59e0b;
      padding: 1px 2px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    `

    // Show original text with indication of change
    if (suggestion.before && suggestion.after && originalText.includes(suggestion.before)) {
      // Replace the specific text with highlighted version
      const beforeIndex = originalText.indexOf(suggestion.before)
      const beforeText = originalText.substring(0, beforeIndex)
      const afterText = originalText.substring(beforeIndex + suggestion.before.length)
      
      // Clear target element
      targetElement.innerHTML = ''
      
      // Add text before suggestion
      if (beforeText) {
        targetElement.appendChild(doc.createTextNode(beforeText))
      }
      
      // Add highlighted suggestion text
      highlight.textContent = suggestion.before
      
      // Create inline suggestion card (appears on hover)
      const suggestionCard = doc.createElement('div')
      suggestionCard.className = 'suggestion-card'
      suggestionCard.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 4px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 200px;
        max-width: 300px;
        display: none;
        font-size: 12px;
      `

      // Suggestion content
      const suggestionContent = doc.createElement('div')
      suggestionContent.style.cssText = `
        margin-bottom: 8px;
      `

      // Show the change
      const changeText = doc.createElement('div')
      changeText.innerHTML = `
        <span style="text-decoration: line-through; color: #ef4444; opacity: 0.7;">${suggestion.before}</span>
        <span style="color: #10b981; margin-left: 8px; font-weight: 500;">→ ${suggestion.after}</span>
      `
      suggestionContent.appendChild(changeText)

      // Rationale
      if (suggestion.rationale) {
        const rationale = doc.createElement('div')
        rationale.style.cssText = `
          color: #6b7280;
          font-size: 11px;
          margin-top: 4px;
          font-style: italic;
        `
        rationale.textContent = suggestion.rationale
        suggestionContent.appendChild(rationale)
      }

      suggestionCard.appendChild(suggestionContent)

      // Action buttons container
      const actions = doc.createElement('div')
      actions.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `

      // Accept button
      const acceptBtn = doc.createElement('button')
      acceptBtn.style.cssText = `
        background: #10b981;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s;
      `
      acceptBtn.innerHTML = 'Apply'
      acceptBtn.onmouseover = () => acceptBtn.style.background = '#059669'
      acceptBtn.onmouseout = () => acceptBtn.style.background = '#10b981'
      acceptBtn.onclick = (e: any) => {
        e.stopPropagation()
        console.log('🚨🚨 GRAMMARLY ACCEPT BUTTON CLICKED:', {
          suggestionId: suggestion.id,
          section: suggestion.section,
          before: suggestion.before,
          after: suggestion.after,
          allSuggestions: suggestions.length,
          appliedSuggestions: appliedSuggestions.size,
          declinedSuggestions: declinedSuggestions.size
        })
        onAccept(suggestion.id)
        highlight.remove()
        targetElement.textContent = beforeText + suggestion.after + afterText
        console.log('✅ GRAMMARLY ACCEPT COMPLETE')
      }

      // Decline button
      const declineBtn = doc.createElement('button')
      declineBtn.style.cssText = `
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s;
      `
      declineBtn.innerHTML = 'Skip'
      declineBtn.onmouseover = () => declineBtn.style.background = '#dc2626'
      declineBtn.onmouseout = () => declineBtn.style.background = '#ef4444'
      declineBtn.onclick = (e: any) => {
        e.stopPropagation()
        console.log('🚨🚨 GRAMMARLY DECLINE BUTTON CLICKED:', {
          suggestionId: suggestion.id,
          section: suggestion.section,
          before: suggestion.before,
          after: suggestion.after,
          allSuggestions: suggestions.length,
          appliedSuggestions: appliedSuggestions.size,
          declinedSuggestions: declinedSuggestions.size
        })
        console.log('🔍 All suggestion IDs before decline:', suggestions.map(s => s.id))
        onDecline(suggestion.id)
        highlight.style.background = 'none'
        highlight.style.borderBottom = 'none'
        suggestionCard.remove()
        console.log('✅ GRAMMARLY DECLINE COMPLETE')
      }

      actions.appendChild(acceptBtn)
      actions.appendChild(declineBtn)
      suggestionCard.appendChild(actions)

      // Add card to highlight
      highlight.appendChild(suggestionCard)

      // Show/hide card on hover
      highlight.onmouseenter = () => {
        suggestionCard.style.display = 'block'
        highlight.style.background = 'linear-gradient(to right, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.4))'
      }
      highlight.onmouseleave = () => {
        suggestionCard.style.display = 'none'
        highlight.style.background = 'linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.3))'
      }

      targetElement.appendChild(highlight)
      
      // Add text after suggestion
      if (afterText) {
        targetElement.appendChild(doc.createTextNode(afterText))
      }
      
      // Store reference
      suggestionRefs.current[suggestion.id] = highlight
    }
  }, [onAccept, onDecline])

  return null // This component only manages DOM manipulation
}