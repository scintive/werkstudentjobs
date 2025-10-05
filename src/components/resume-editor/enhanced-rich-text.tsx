'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bold, Italic, Underline, Highlighter, Type, Trash2, Undo, Redo, Link } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedRichTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  readOnly?: boolean
  showHighlight?: boolean // Enable highlight feature
  showLink?: boolean // Enable link feature
}

// Enhanced component with more formatting options
export const EnhancedRichText = ({
  value,
  onChange,
  className,
  multiline = false,
  placeholder = "Click to edit...",
  readOnly = false,
  showHighlight = false,
  showLink = false
}: EnhancedRichTextProps) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [showToolbar, setShowToolbar] = React.useState(false)
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [localValue, setLocalValue] = React.useState(value)
  const [undoStack, setUndoStack] = React.useState<string[]>([])
  const [redoStack, setRedoStack] = React.useState<string[]>([])
  const [lastSavedValue, setLastSavedValue] = React.useState(value)
  const debounceTimerRef = React.useRef<NodeJS.Timeout>()
  const [selectedText, setSelectedText] = React.useState('')

  // Sync with props only when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(value)
      setLastSavedValue(value)
    }
  }, [value, isEditing])
  
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
      setUndoStack(prev => [...prev.slice(-19), lastSavedValue]) // Keep last 20 states
      setRedoStack([]) // Clear redo stack when new action is performed
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
    
    // Set content and focus after state update
    requestAnimationFrame(() => {
      if (editorRef.current) {
        // Clear any placeholder content first
        editorRef.current.innerHTML = localValue || ''
        editorRef.current.focus()
        
        // Place cursor at end of content
        if (localValue) {
          const range = document.createRange()
          const selection = window.getSelection()
          
          try {
            // Position cursor at the end of existing content
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
            // If range positioning fails, just focus the element
            editorRef.current.focus()
          }
        }
      }
    })
  }, [localValue, readOnly])

  const finishEditing = React.useCallback(() => {
    // Clear any pending debounced updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML
      // Only update if value actually changed to prevent unnecessary re-renders
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
      
      // Store selected text for link insertion
      if (command === 'createLink' && selectedText) {
        setSelectedText(selectedText)
      }
      
      // If no text is selected, don't apply formatting (except for special cases)
      if (!selectedText.trim() && command !== 'removeFormat') {
        return
      }
      
      // Create a new range to avoid modifying the original
      const newRange = range.cloneRange()
      
      // Focus the editor to ensure proper context
      editorRef.current.focus()
      
      // Restore selection before applying formatting
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      // Apply formatting using execCommand
      let result = false
      if (command === 'highlight') {
        // Custom highlight implementation
        result = document.execCommand('hiliteColor', false, '#ffeb3b')
      } else if (command === 'createLink' && value) {
        result = document.execCommand(command, false, value)
      } else {
        result = document.execCommand(command, false, undefined)
      }
      
      if (result) {
        // Update local value after successful formatting
        const newContent = editorRef.current.innerHTML
        setLocalValue(newContent)
        
        // Trigger onChange to update parent component
        onChange(newContent)
        
        // Keep focus on editor
        editorRef.current.focus()
      }
    } catch (e) {
      console.warn('Formatting failed:', e)
      // Ensure editor stays focused even on error
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }
  }, [isEditing, onChange])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    // CRITICAL: Prevent all default behaviors that could cause page refresh
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.stopPropagation()
      finishEditing()
      return
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      // Cancel editing
      if (editorRef.current) {
        editorRef.current.innerHTML = value
      }
      setIsEditing(false)
      setShowToolbar(false)
      return
    }
    // Keyboard shortcuts
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
    
    // For all other keys during editing, prevent any potential form submission
    if (isEditing) {
      e.stopPropagation()
    }
  }, [multiline, finishEditing, value, applyFormatting, handleUndo, handleRedo, isEditing, showHighlight])

  const handleInput = React.useCallback(() => {
    if (editorRef.current && isEditing) {
      const currentContent = editorRef.current.innerHTML
      // Update local value immediately for UI responsiveness
      setLocalValue(currentContent)
      
      // Debounce the onChange call to prevent page refresh on every keystroke
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      // Only call onChange after user stops typing for 1200ms to prevent refresh
      debounceTimerRef.current = setTimeout(() => {
        if (currentContent !== value) {
          onChange(currentContent)
        }
      }, 1200)
    }
  }, [isEditing, value, onChange])

  // Consistent styling for both modes
  const baseStyles = cn(
    "cursor-text transition-all duration-200 rounded-md min-h-[28px] relative",
    className
  )
  
  const displayStyles = cn(
    baseStyles,
    readOnly ? "cursor-default" : "cursor-text",
    "p-2 border-0",
    !localValue && "text-gray-400",
    !readOnly && "relative"
  )

  const editingStyles = cn(
    baseStyles,
    "outline-none focus:outline-none bg-transparent p-2 border-0"
  )

  return (
    <div className="relative group">
      {/* Single div that handles both display and editing */}
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
          // Prevent any layout shifts
          boxSizing: 'border-box'
        }}
        // Only use dangerouslySetInnerHTML when not editing to prevent double text
        {...(!isEditing && {
          dangerouslySetInnerHTML: {
            __html: localValue || `<span style="color: #9ca3af;">${placeholder}</span>`
          }
        })}
      >
        {/* Content is handled by dangerouslySetInnerHTML in display mode, innerHTML in edit mode */}
      </div>
      
      {/* Enhanced Rich Text Toolbar */}
      <AnimatePresence>
        {showToolbar && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-16 left-0 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-2 flex gap-1 z-50"
            style={{
              background: 'linear-gradient(to right, white, #fafafa)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
            }}
          >
            <div className="flex items-center gap-1">
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
      
      {/* Premium edit indicator with gradient */}
      {!isEditing && !readOnly && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </div>
  )
}