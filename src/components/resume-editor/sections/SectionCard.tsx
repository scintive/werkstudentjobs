'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Section colors for each type - vibrant and modern
export const sectionColors = {
  personal: { icon: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-50 text-blue-700' },
  summary: { icon: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-50 text-indigo-700' },
  experience: { icon: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-50 text-emerald-700' },
  projects: { icon: 'text-cyan-600', bg: 'bg-cyan-50', badge: 'bg-cyan-50 text-cyan-700' },
  skills: { icon: 'text-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-50 text-violet-700' },
  languages: { icon: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-50 text-purple-700' },
  certifications: { icon: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-50 text-amber-700' },
  education: { icon: 'text-teal-600', bg: 'bg-teal-50', badge: 'bg-teal-50 text-teal-700' },
  custom: { icon: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-50 text-rose-700' }
}

// Clean Section Card Component
export interface SectionCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string | number
  onAdd?: () => void
  className?: string
  sectionType?: keyof typeof sectionColors
  isExpanded?: boolean
  onToggle?: () => void
}

export const SectionCard = ({
  title,
  icon,
  children,
  badge,
  onAdd,
  className,
  sectionType = 'personal',
  isExpanded = true,
  onToggle
}: SectionCardProps) => {
  const colors = sectionColors[sectionType]
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "p-4 flex items-center justify-between transition-all duration-200",
          onToggle ? "cursor-pointer" : ""
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {React.cloneElement(icon as React.ReactElement, { className: cn('w-5 h-5', colors.icon) })}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className={cn(
              "text-sm px-2 py-0.5 rounded-full font-medium",
              colors.badge
            )}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && isExpanded && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </motion.button>
          )}
          {onToggle && (
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </motion.div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
