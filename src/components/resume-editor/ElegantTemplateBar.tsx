'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Download,
  Share2,
  Mail,
  Link2,
  Check,
  Loader2,
  FileText,
  Sparkles,
  Copy,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  color: string
  preview: string
}

const templates: Template[] = [
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Minimal & Clean',
    color: 'bg-gray-900',
    preview: '/swiss.png'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate Excellence',
    color: 'bg-blue-600',
    preview: '/modern.png'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless Design',
    color: 'bg-amber-600',
    preview: '/classic.png'
  },
  {
    id: 'impact',
    name: 'Impact',
    description: 'Bold & Creative',
    color: 'bg-purple-600',
    preview: '/impact.png'
  }
]

export function ElegantTemplateBar({
  activeTemplate,
  onChange,
  onExport
}: {
  activeTemplate: string
  onChange: (template: string) => void
  onExport?: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [showShareMenu, setShowShareMenu] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const activeTemplateData = templates.find(t => t.id === activeTemplate) || templates[0]

  const handleExport = async () => {
    if (!onExport) return
    setIsExporting(true)
    try {
      await onExport()
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  const handleCopyLink = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (method: string) => {
    // Implement share logic here
    console.log('Share via:', method)
    setShowShareMenu(false)
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-8 h-20 flex items-center justify-between">
        {/* Left: Auto-save indicator */}
        <div className="flex items-center gap-2.5 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">Auto-saved</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="h-10 px-4 flex items-center gap-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-gray-200"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span className="text-sm font-medium">Copy Link</span>
              </>
            )}
          </button>

          {/* Share Menu */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="h-10 px-4 flex items-center gap-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-gray-200"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>

            <AnimatePresence>
              {showShareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => handleShare('email')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Email Resume</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Share to LinkedIn</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Copy Link</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Template Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="group h-11 pl-4 pr-5 flex items-center gap-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              <FileText className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500 font-medium">Template</div>
                <div className="text-sm font-semibold text-gray-900 -mt-0.5">{activeTemplateData.name}</div>
              </div>
              <svg
                className={cn(
                  'w-4 h-4 text-gray-500 transition-transform duration-200 ml-2',
                  isOpen && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                    style={{ width: 'max-content', maxWidth: '95vw' }}
                  >
                    <div className="p-5">
                      <div className="px-1 pb-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Choose Template</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Select your resume design</p>
                        </div>
                        <span className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                          Free in Beta
                        </span>
                      </div>

                      <div className="mt-4 flex gap-3">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              onChange(template.id)
                              setIsOpen(false)
                            }}
                            className={cn(
                              'group relative flex flex-col gap-2.5 p-3 rounded-xl transition-all duration-200 text-left',
                              activeTemplate === template.id
                                ? 'bg-gray-50 ring-2 ring-gray-900 ring-offset-2'
                                : 'border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            )}
                            style={{ width: '180px' }}
                          >
                            {/* Image Preview */}
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              <img
                                src={template.preview}
                                alt={template.name}
                                className="w-full h-full object-cover object-top"
                                style={{ objectPosition: 'top center' }}
                              />
                              {activeTemplate === template.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" fill="white" />
                                </div>
                              )}
                            </div>

                            {/* Template Info */}
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">{template.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'h-10 px-5 flex items-center gap-2.5 rounded-lg font-medium transition-all duration-200',
              isExporting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm">Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
