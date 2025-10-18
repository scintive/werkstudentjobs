'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Palette } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  preview: string
}

const templates: Template[] = [
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Minimal & Clean',
    preview: 'bg-white'
  },
  {
    id: 'impact',
    name: 'Impact', 
    description: 'Bold & Eye-catching',
    preview: 'bg-gradient-to-br from-purple-50 to-pink-50'
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
    preview: 'bg-blue-50'
  }
]

export function SimpleTemplateDropdown({ 
  activeTemplate, 
  onChange 
}: {
  activeTemplate: string
  onChange: (template: string) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const activeTemplateData = templates.find(t => t.id === activeTemplate) || templates[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-4 flex items-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-all duration-200 group"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 group-hover:bg-gray-200 transition-colors">
          <Palette className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <span className="font-medium text-[15px] text-gray-900">{activeTemplateData.name}</span>
        <svg 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200 ml-auto",
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
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="p-1">
              {templates.map((template: any) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onChange(template.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                    activeTemplate === template.id 
                      ? "bg-gray-100 text-gray-900" 
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  )}
                >
                  <div className={cn(
                    "w-1 h-8 rounded-full transition-all duration-200",
                    activeTemplate === template.id ? "bg-gray-900" : "bg-gray-200"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium text-[14px]">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}