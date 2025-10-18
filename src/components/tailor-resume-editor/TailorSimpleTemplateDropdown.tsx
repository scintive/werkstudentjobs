'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Palette, Sparkles } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  preview: string
  aiOptimized?: boolean
}

const templates: Template[] = [
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Minimal & Clean',
    preview: 'bg-white',
    aiOptimized: true
  },
  {
    id: 'impact',
    name: 'Impact', 
    description: 'Bold & Eye-catching',
    preview: 'bg-gradient-to-br from-purple-50 to-pink-50',
    aiOptimized: true
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional',
    preview: 'bg-amber-50'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate', 
    preview: 'bg-blue-50',
    aiOptimized: true
  }
]

export function TailorSimpleTemplateDropdown({ 
  activeTemplate = 'swiss', 
  onChange 
}: {
  activeTemplate?: string
  onChange?: (template: string) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const activeTemplateData = templates.find(t => t.id === activeTemplate) || templates[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded text-sm transition-colors"
      >
        <Palette className="w-3 h-3 text-gray-600" />
        <span className="font-medium text-gray-900">{activeTemplateData.name}</span>
        {activeTemplateData.aiOptimized && (
          <Sparkles className="w-3 h-3 text-blue-600" />
        )}
        <svg 
          className={cn(
            "w-3 h-3 text-gray-400 transition-transform duration-200 ml-1",
            isOpen && "rotate-180"
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="p-1">
              {templates.map((template: any) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onChange?.(template.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors text-sm",
                    activeTemplate === template.id 
                      ? "bg-blue-50 text-blue-900" 
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <div className={cn(
                    "w-2 h-6 rounded-full",
                    activeTemplate === template.id ? "bg-blue-600" : "bg-gray-200"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{template.name}</span>
                      {template.aiOptimized && (
                        <Sparkles className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-100 px-3 py-2">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>AI Enhanced templates</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}