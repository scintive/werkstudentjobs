'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Edit3, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Textarea } from "./textarea"

interface InlineEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  label?: string
  displayClassName?: string
}

export function InlineEditor({
  value,
  onChange,
  placeholder = "Click to edit...",
  multiline = false,
  className,
  label,
  displayClassName
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [tempValue, setTempValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (!multiline) {
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  React.useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleStartEdit = () => {
    setIsEditing(true)
    setTempValue(value)
  }

  const handleSave = () => {
    onChange(tempValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
    if (e.key === 'Enter' && multiline && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const displayValue = value || placeholder
  const isEmpty = !value

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("relative", className)}
      >
        {label && (
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <InputComponent
            ref={inputRef as unknown}
            value={tempValue}
            onChange={(e: any) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "pr-20 resize-none",
              multiline && "min-h-[80px]"
            )}
            rows={multiline ? 3 : undefined}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <button
              onClick={handleSave}
              className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Save (Enter)"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancel}
              className="w-6 h-6 flex items-center justify-center rounded bg-gray-400 text-white hover:bg-gray-500 transition-colors"
              title="Cancel (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        {multiline && (
          <div className="text-xs text-gray-500 mt-1">
            Press Ctrl+Enter to save, Esc to cancel
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn("group relative", className)}
    >
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={handleStartEdit}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-transparent transition-all duration-200",
          "hover:border-blue-300 hover:bg-blue-50 hover:shadow-md",
          "group-hover:border-blue-300 group-hover:bg-blue-50/30",
          "focus-within:ring-2 focus-within:ring-blue-100",
          multiline ? "p-3 min-h-[80px]" : "p-3 h-12 flex items-center",
          isEmpty && "text-gray-400 italic border-dashed border-gray-300 hover:border-blue-300",
          displayClassName
        )}
        title="Click to edit"
      >
        <span className={cn(
          "block w-full",
          isEmpty && "text-gray-400"
        )}>
          {displayValue}
        </span>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-blue-600 hover:scale-110 transition-all">
            <Edit3 className="w-3 h-3" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}