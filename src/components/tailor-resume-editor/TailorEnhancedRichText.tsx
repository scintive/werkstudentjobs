'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bold, Italic, Underline, Highlighter, Type, Trash2, Undo, Redo, Link, Sparkles, Brain, Zap, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TailorEnhancedRichTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  readOnly?: boolean
  showHighlight?: boolean
  showLink?: boolean
  // AI Enhancement props
  aiSuggestion?: string
  aiConfidence?: number
  onSuggestionAccept?: () => void
  onSuggestionReject?: () => void
  jobKeywords?: string[]
  isOptimizedForJob?: boolean
}

// Enhanced component with AI suggestions integration
export const TailorEnhancedRichText = ({
  value,
  onChange,
  className,
  multiline = false,
  placeholder = "Click to edit...",
  readOnly = false,
  showHighlight = false,
  showLink = false,
  aiSuggestion,
  aiConfidence,
  onSuggestionAccept,
  onSuggestionReject,
  jobKeywords = [],
  isOptimizedForJob = false
}: TailorEnhancedRichTextProps) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [showToolbar, setShowToolbar] = React.useState(false)
  const [showAISuggestion, setShowAISuggestion] = React.useState(false)
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [localValue, setLocalValue] = React.useState(value)
  const [undoStack, setUndoStack] = React.useState<string[]>([])
  const [redoStack, setRedoStack] = React.useState<string[]>([])
  const [lastSavedValue, setLastSavedValue] = React.useState(value)
  const debounceTimerRef = React.useRef<NodeJS.Timeout>()
  const [selectedText, setSelectedText] = React.useState('')
  const [keywordHighlights, setKeywordHighlights] = React.useState<string[]>([])

  // Sync with props only when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(value)
      setLastSavedValue(value)
    }
  }, [value, isEditing])
  
  // Show AI suggestion when available
  React.useEffect(() => {
    if (aiSuggestion && aiSuggestion !== value && !isEditing) {
      setShowAISuggestion(true)
    }
  }, [aiSuggestion, value, isEditing])
  
  // Highlight job keywords in text
  React.useEffect(() => {
    if (jobKeywords.length > 0 && value) {
      const foundKeywords = jobKeywords.filter(keyword =>
        value.toLowerCase().includes(keyword.toLowerCase())
      )
      setKeywordHighlights(foundKeywords)
    }
  }, [jobKeywords, value])
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const pushToUndoStack = React.useCallback((newValue: string) => {
    if (lastSavedValue !== newValue) {
      setUndoStack(prev => [...prev.slice(-19), lastSavedValue])
      setRedoStack([])
      setLastSavedValue(newValue)
    }
  }, [lastSavedValue])

  const handleUndo = React.useCallback(() => {
    if (undoStack.length > 0) {
      const previousValue = undoStack[undoStack.length - 1]
      setUndoStack(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, localValue])
      setLocalValue(previousValue)
      onChange(previousValue)
      
      if (editorRef.current) {
        editorRef.current.innerHTML = previousValue
      }
    }
  }, [undoStack, localValue, onChange])

  const handleRedo = React.useCallback(() => {
    if (redoStack.length > 0) {
      const nextValue = redoStack[redoStack.length - 1]
      setRedoStack(prev => prev.slice(0, -1))
      setUndoStack(prev => [...prev, localValue])
      setLocalValue(nextValue)
      onChange(nextValue)
      
      if (editorRef.current) {
        editorRef.current.innerHTML = nextValue
      }
    }
  }, [redoStack, localValue, onChange])

  const startEditing = React.useCallback(() => {
    if (readOnly) return
    setIsEditing(true)
    setShowToolbar(true)
    setShowAISuggestion(false) // Hide AI suggestion when editing
    
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = localValue || ''
        editorRef.current.focus()
        
        if (localValue) {
          const range = document.createRange()
          const selection = window.getSelection()
          
          try {
            if (editorRef.current.childNodes.length > 0) {
              const lastNode = editorRef.current.lastChild!
              if (lastNode.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, lastNode.textContent?.length || 0)
              } else {
                range.setStartAfter(lastNode)
              }
            } else {
              range.setStart(editorRef.current, 0)
            }
            range.collapse(true)
            
            selection?.removeAllRanges()
            selection?.addRange(range)
          } catch (e) {
            editorRef.current.focus()
          }
        }
      }
    })
  }, [localValue, readOnly])

  const finishEditing = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML
      if (newValue !== value) {
        pushToUndoStack(localValue)
        setLocalValue(newValue)
        onChange(newValue)
      }
    }
    setIsEditing(false)
    setShowToolbar(false)
  }, [onChange, pushToUndoStack, localValue, value])

  const applyFormatting = React.useCallback((command: string, value?: string) => {
    if (!editorRef.current || !isEditing) return
    
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      if (command === 'createLink' && selectedText) {
        setSelectedText(selectedText)
      }
      
      if (!selectedText.trim() && command !== 'removeFormat') {
        return
      }
      
      const newRange = range.cloneRange()
      editorRef.current.focus()
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      let result = false
      if (command === 'highlight') {
        result = document.execCommand('hiliteColor', false, '#ffeb3b')
      } else if (command === 'createLink' && value) {
        result = document.execCommand(command, false, value)
      } else {
        result = document.execCommand(command, false, undefined)
      }
      
      if (result) {
        const newContent = editorRef.current.innerHTML
        setLocalValue(newContent)
        onChange(newContent)
        editorRef.current.focus()
      }
    } catch (e) {
      console.warn('Formatting failed:', e)
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }
  }, [isEditing, onChange])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.stopPropagation()
      finishEditing()
      return
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (editorRef.current) {
        editorRef.current.innerHTML = value
      }
      setIsEditing(false)
      setShowToolbar(false)
      return
    }
    else if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault()
        e.stopPropagation()
        applyFormatting('bold')
        return
      } else if (e.key === 'i') {
        e.preventDefault()
        e.stopPropagation()
        applyFormatting('italic')
        return
      } else if (e.key === 'u') {
        e.preventDefault()
        e.stopPropagation()
        applyFormatting('underline')
        return
      } else if (e.key === 'h' && showHighlight) {
        e.preventDefault()
        e.stopPropagation()
        applyFormatting('highlight')
        return
      } else if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        handleUndo()
        return
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        e.stopPropagation()
        handleRedo()
        return
      }
    }
    
    if (isEditing) {
      e.stopPropagation()
    }
  }, [multiline, finishEditing, value, applyFormatting, handleUndo, handleRedo, isEditing, showHighlight])

  const handleInput = React.useCallback(() => {
    if (editorRef.current && isEditing) {
      const currentContent = editorRef.current.innerHTML
      setLocalValue(currentContent)
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      debounceTimerRef.current = setTimeout(() => {
        if (currentContent !== value) {
          onChange(currentContent)
        }
      }, 1200)
    }
  }, [isEditing, value, onChange])

  const acceptAISuggestion = React.useCallback(() => {
    if (aiSuggestion) {
      pushToUndoStack(localValue)
      setLocalValue(aiSuggestion)
      onChange(aiSuggestion)
      setShowAISuggestion(false)
      onSuggestionAccept?.()
    }
  }, [aiSuggestion, localValue, onChange, pushToUndoStack, onSuggestionAccept])

  const rejectAISuggestion = React.useCallback(() => {
    setShowAISuggestion(false)
    onSuggestionReject?.()
  }, [onSuggestionReject])

  // Consistent styling for both modes
  const baseStyles = cn(
    "cursor-text transition-all duration-200 rounded-md min-h-[28px] relative",
    className
  )
  
  const displayStyles = cn(
    baseStyles,
    readOnly ? "cursor-default" : "cursor-text",
    "p-2 border transition-all duration-200",
    isOptimizedForJob 
      ? "border-green-300 bg-green-50/50 hover:border-green-400" 
      : "border-transparent hover:border-gray-200",
    !localValue && "text-gray-400",
    !readOnly && "relative hover:bg-gray-50/50"
  )
  
  const editingStyles = cn(
    baseStyles,
    "outline-2 outline-blue-400 outline-offset-0 bg-white focus:outline-none p-2 border border-blue-300 shadow-sm"
  )

  return (
    <div className="relative group">
      {/* AI Job Optimization Indicator */}
      {isOptimizedForJob && !isEditing && (
        <div className="absolute -top-2 -right-2 z-40">
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Keyword Highlights Indicator */}
      {keywordHighlights.length > 0 && !isEditing && (
        <div className="absolute -top-2 -left-2 z-40">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center">
            <span className="text-xs font-bold text-white">{keywordHighlights.length}</span>
          </div>
        </div>
      )}
      
      {/* Main Editor */}
      <div
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onClick={!isEditing && !readOnly ? (e) => {
          e.preventDefault()
          e.stopPropagation()
          startEditing()
        } : undefined}
        onBlur={isEditing ? finishEditing : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        onInput={isEditing ? handleInput : undefined}
        className={isEditing ? editingStyles : displayStyles}
        style={{ 
          minHeight: multiline ? '80px' : '32px',
          boxSizing: 'border-box'
        }}
        {...(!isEditing && {
          dangerouslySetInnerHTML: {
            __html: localValue || `<span style="color: #9ca3af;">${placeholder}</span>`
          }
        })}
      />
      
      {/* AI Suggestion Overlay */}
      <AnimatePresence>
        {showAISuggestion && aiSuggestion && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl p-4 border border-purple-400/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                <Brain className="w-4 h-4 text-yellow-300" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-bold">AI Enhancement</h4>
                  {aiConfidence && (
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
                      {aiConfidence}% match
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Current:</p>
                    <p className="text-xs bg-white/10 rounded p-2 border border-white/20">
                      {value || placeholder}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-purple-200 mb-1">AI Suggestion:</p>
                    <p className="text-xs bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded p-2 border border-green-300/30">
                      {aiSuggestion}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <motion.button
                    onClick={acceptAISuggestion}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Accept
                  </motion.button>
                  
                  <motion.button
                    onClick={rejectAISuggestion}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="w-3 h-3" />
                    Dismiss
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Rich Text Toolbar with AI Features */}
      <AnimatePresence>
        {showToolbar && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-16 left-0 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl shadow-2xl p-2 flex gap-1 z-50"
          >
            <div className="flex items-center gap-1">
              {/* AI Enhancement Button */}
              {aiSuggestion && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      acceptAISuggestion()
                      finishEditing()
                    }}
                    className="p-2 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                    title="Apply AI Suggestion"
                  >
                    <Sparkles className="w-4 h-4 group-hover:text-purple-600" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                </>
              )}
              
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  applyFormatting('bold')
                }}
                className="p-2 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4 group-hover:text-blue-600" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  applyFormatting('italic')
                }}
                className="p-2 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4 group-hover:text-blue-600" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  applyFormatting('underline')
                }}
                className="p-2 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-4 h-4 group-hover:text-blue-600" />
              </button>
              
              {showHighlight && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyFormatting('highlight')
                  }}
                  className="p-2 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                  title="Highlight (Ctrl+H)"
                >
                  <Highlighter className="w-4 h-4 group-hover:text-yellow-600" />
                </button>
              )}
              
              {showLink && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const url = prompt('Enter URL:')
                    if (url) {
                      applyFormatting('createLink', url)
                    }
                  }}
                  className="p-2 hover:bg-gradient-to-r hover:from-green-100 hover:to-teal-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                  title="Add Link"
                >
                  <Link className="w-4 h-4 group-hover:text-green-600" />
                </button>
              )}
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  applyFormatting('removeFormat')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                title="Clear Formatting"
              >
                <Type className="w-4 h-4 group-hover:text-gray-600" />
              </button>
              
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleUndo()
                }}
                disabled={undoStack.length === 0}
                className={cn(
                  "p-2 hover:bg-gray-100 rounded-lg transition-all duration-200",
                  undoStack.length === 0 && "opacity-50 cursor-not-allowed"
                )}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRedo()
                }}
                disabled={redoStack.length === 0}
                className={cn(
                  "p-2 hover:bg-gray-100 rounded-lg transition-all duration-200",
                  redoStack.length === 0 && "opacity-50 cursor-not-allowed"
                )}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Job Keywords Tooltip */}
      {keywordHighlights.length > 0 && !isEditing && (
        <div className="absolute -bottom-8 left-0 z-30">
          <div className="flex gap-1">
            {keywordHighlights.slice(0, 3).map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200"
              >
                {keyword}
              </span>
            ))}
            {keywordHighlights.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{keywordHighlights.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Enhanced edit indicator with AI glow */}
      {!isEditing && !readOnly && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isOptimizedForJob
            ? "bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"
            : "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
        )} />
      )}
    </div>
  )
}