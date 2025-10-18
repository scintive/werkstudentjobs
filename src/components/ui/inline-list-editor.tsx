'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, GripVertical, Edit3, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Badge } from "./badge"

interface InlineListEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  label?: string
  itemClassName?: string
  addButtonText?: string
  type?: 'tags' | 'list'
}

export function InlineListEditor({
  value = [],
  onChange,
  placeholder = "Add item...",
  className,
  label,
  itemClassName,
  addButtonText = "Add item",
  type = 'list'
}: InlineListEditorProps) {
  const [isAdding, setIsAdding] = React.useState(false)
  const [newItem, setNewItem] = React.useState('')
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [editingValue, setEditingValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  React.useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingIndex])

  const handleAddItem = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()])
      setNewItem('')
      setIsAdding(false)
    }
  }

  const handleEditItem = (index: number) => {
    setEditingIndex(index)
    setEditingValue(value[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const newValue = [...value]
      newValue[editingIndex] = editingValue.trim()
      onChange(newValue)
    }
    setEditingIndex(null)
    setEditingValue('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingValue('')
  }

  const handleRemoveItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isAdding) {
        handleAddItem()
      } else if (editingIndex !== null) {
        handleSaveEdit()
      }
    }
    if (e.key === 'Escape') {
      if (isAdding) {
        setIsAdding(false)
        setNewItem('')
      } else if (editingIndex !== null) {
        handleCancelEdit()
      }
    }
  }

  const renderTagsView = () => (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {value.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="group relative"
          >
            {editingIndex === index ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={(e: any) => setEditingValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs"
                  style={{ width: `${Math.max(editingValue.length, 10)}ch` }}
                />
                <button
                  onClick={handleSaveEdit}
                  className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className={cn(
                  "cursor-pointer hover:bg-blue-100 transition-colors pr-6 relative group",
                  itemClassName
                )}
                onClick={() => handleEditItem(index)}
              >
                {item}
                <button
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleRemoveItem(index)
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-2 h-2" />
                </button>
              </Badge>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1"
        >
          <Input
            ref={inputRef}
            value={newItem}
            onChange={(e: any) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-8 text-xs"
          />
          <button
            onClick={handleAddItem}
            className="w-6 h-6 flex items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="w-3 h-3" />
          </button>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-xs hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
          {addButtonText}
        </motion.button>
      )}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      <AnimatePresence>
        {value.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            
            {editingIndex === index ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={(e: any) => setEditingValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                />
                <button
                  onClick={handleSaveEdit}
                  className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-400 text-white hover:bg-gray-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span
                  className="flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleEditItem(index)}
                >
                  • {item}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => handleEditItem(index)}
                    className="w-6 h-6 flex items-center justify-center rounded text-blue-500 hover:bg-blue-100"
                    title="Edit"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-100"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2"
        >
          <div className="w-4 h-4" />
          <span className="text-gray-400">•</span>
          <Input
            ref={inputRef}
            value={newItem}
            onChange={(e: any) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="text-sm"
          />
          <button
            onClick={handleAddItem}
            className="w-6 h-6 flex items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false)
              setNewItem('')
            }}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-400 text-white hover:bg-gray-500"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-colors"
        >
          <div className="w-4 h-4" />
          <Plus className="w-4 h-4" />
          {addButtonText}
        </motion.button>
      )}
    </div>
  )

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      {type === 'tags' ? renderTagsView() : renderListView()}
    </motion.div>
  )
}