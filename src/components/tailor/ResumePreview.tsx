'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResumePreviewProps {
  data: any
  template: string
  onTemplateChange: (template: string) => void
}

const TEMPLATES = [
  { id: 'swiss', name: 'Swiss', description: 'Minimal & Professional' },
  { id: 'impact', name: 'Impact', description: 'Bold & Modern' },
  { id: 'classic', name: 'Classic', description: 'Traditional' },
  { id: 'professional', name: 'Professional', description: 'Corporate' }
]

export function ResumePreview({ data, template, onTemplateChange }: ResumePreviewProps) {
  const [previewHtml, setPreviewHtml] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  // Generate preview when data or template changes
  React.useEffect(() => {
    if (!data) return
    
    const generatePreview = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/resume/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeData: data,
            template: template,
            showSkillLevelsInResume: false
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          setPreviewHtml(result.html)
          console.log('📱 Preview generated for template:', template)
        }
      } catch (error) {
        console.error('Preview generation failed:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(generatePreview, 500) // Debounced
    return () => clearTimeout(timeoutId)
  }, [data, template])

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 bg-white/60 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
          >
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-[700px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Generating preview...</p>
            </div>
          </div>
        ) : previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            style={{ 
              transform: 'scale(0.8)',
              transformOrigin: 'top left',
              width: '125%',
              height: '125%'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading preview...</p>
          </div>
        )}
      </div>
    </div>
  )
}