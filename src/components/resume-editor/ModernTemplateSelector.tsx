'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Download,
  Sparkles,
  Palette,
  ChevronDown,
  FileText,
  Layers,
  Zap,
  Award,
  Check,
  Eye,
  Share2,
  Mail
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  gradient: string
  icon: React.ReactNode
  preview: string
  features: string[]
  popular?: boolean
}

const templates: Template[] = [
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Clean & Minimalist',
    gradient: 'from-gray-50 to-white',
    icon: <Layers className="w-4 h-4" />,
    preview: '/api/placeholder/300/400',
    features: ['ATS Optimized', 'Clean Layout', 'Professional'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate Excellence',
    gradient: 'from-blue-50 to-indigo-50',
    icon: <Award className="w-4 h-4" />,
    preview: '/api/placeholder/300/400',
    features: ['Executive Style', 'Two Column', 'Skills Focus'],
    popular: true
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless Elegance',
    gradient: 'from-amber-50 to-orange-50',
    icon: <FileText className="w-4 h-4" />,
    preview: '/api/placeholder/300/400',
    features: ['Traditional', 'Readable', 'Structured']
  },
  {
    id: 'impact',
    name: 'Impact',
    description: 'Bold & Creative',
    gradient: 'from-purple-50 to-pink-50',
    icon: <Zap className="w-4 h-4" />,
    preview: '/api/placeholder/300/400',
    features: ['Modern Design', 'Visual Appeal', 'Creative Fields']
  }
]

// Mini preview components for each template
const TemplatePreview = ({ templateId }: { templateId: string }) => {
  const previewStyles: Record<string, React.ReactNode> = {
    swiss: (
      <div className="w-full h-full bg-white p-3 space-y-2">
        <div className="h-3 bg-gray-900 rounded w-2/3"></div>
        <div className="h-2 bg-gray-400 rounded w-1/2"></div>
        <div className="space-y-1 pt-2">
          <div className="h-1.5 bg-gray-200 rounded"></div>
          <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
          <div className="h-1.5 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="space-y-1">
            <div className="h-2 bg-gray-800 rounded w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded"></div>
            <div className="h-1 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-800 rounded w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded"></div>
            <div className="h-1 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
    professional: (
      <div className="w-full h-full bg-gradient-to-b from-blue-600 to-blue-700 p-3 space-y-2">
        <div className="bg-white/20 backdrop-blur rounded p-2">
          <div className="h-3 bg-white rounded w-2/3"></div>
          <div className="h-2 bg-white/60 rounded w-1/2 mt-1"></div>
        </div>
        <div className="bg-white rounded p-2 space-y-1">
          <div className="h-1.5 bg-blue-100 rounded"></div>
          <div className="h-1.5 bg-blue-100 rounded w-5/6"></div>
          <div className="h-1.5 bg-blue-100 rounded w-4/6"></div>
        </div>
        <div className="bg-white rounded p-2 space-y-1">
          <div className="h-2 bg-blue-600 rounded w-1/2"></div>
          <div className="flex gap-1">
            <div className="h-1 bg-blue-200 rounded flex-1"></div>
            <div className="h-1 bg-blue-200 rounded flex-1"></div>
          </div>
        </div>
      </div>
    ),
    classic: (
      <div className="w-full h-full bg-gradient-to-b from-amber-50 to-white p-3 space-y-2">
        <div className="border-b-2 border-amber-200 pb-2">
          <div className="h-3 bg-amber-900 rounded w-2/3"></div>
          <div className="h-2 bg-amber-600 rounded w-1/2 mt-1"></div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 bg-amber-100 rounded"></div>
          <div className="h-1.5 bg-amber-100 rounded w-5/6"></div>
          <div className="h-1.5 bg-amber-100 rounded w-4/6"></div>
        </div>
        <div className="border-l-2 border-amber-300 pl-2 space-y-1">
          <div className="h-2 bg-amber-700 rounded w-3/4"></div>
          <div className="h-1 bg-amber-100 rounded"></div>
          <div className="h-1 bg-amber-100 rounded w-5/6"></div>
        </div>
      </div>
    ),
    impact: (
      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 p-3 space-y-2">
        <div className="bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
          <div className="h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded w-2/3"></div>
          <div className="h-2 bg-gray-600 rounded w-1/2 mt-1"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/80 rounded p-1.5 space-y-1">
            <div className="h-1.5 bg-purple-200 rounded"></div>
            <div className="h-1.5 bg-purple-200 rounded w-4/5"></div>
          </div>
          <div className="bg-white/80 rounded p-1.5 space-y-1">
            <div className="h-1.5 bg-pink-200 rounded"></div>
            <div className="h-1.5 bg-pink-200 rounded w-4/5"></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded p-2">
          <div className="h-2 bg-white rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return previewStyles[templateId] || previewStyles.swiss
}

export function ModernTemplateSelector({
  activeTemplate,
  onChange,
  onExport
}: {
  activeTemplate: string
  onChange: (template: string) => void
  onExport?: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredTemplate, setHoveredTemplate] = React.useState<string | null>(null)
  const activeTemplateData = templates.find(t => t.id === activeTemplate) || templates[0]

  return (
    <div className="flex items-center gap-3 h-14 bg-white border-b border-gray-200 px-6">
      {/* Template Selector */}
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-4 flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm",
            activeTemplateData.gradient
          )}>
            {activeTemplateData.icon}
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500 font-medium">Template</div>
            <div className="font-semibold text-sm text-gray-900">{activeTemplateData.name}</div>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Choose Resume Template</h3>
                    <span className="text-xs text-gray-500">4 Professional Designs</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => {
                          onChange(template.id)
                          setIsOpen(false)
                        }}
                        onMouseEnter={() => setHoveredTemplate(template.id)}
                        onMouseLeave={() => setHoveredTemplate(null)}
                        className={cn(
                          "relative group rounded-xl border-2 transition-all duration-200 overflow-hidden",
                          activeTemplate === template.id
                            ? "border-blue-500 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        )}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Popular Badge */}
                        {template.popular && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                              POPULAR
                            </span>
                          </div>
                        )}

                        {/* Active Indicator */}
                        {activeTemplate === template.id && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Preview */}
                        <div className="h-32 overflow-hidden bg-gray-50">
                          <TemplatePreview templateId={template.id} />
                        </div>

                        {/* Info */}
                        <div className="p-3 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                              <p className="text-xs text-gray-500">{template.description}</p>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="flex flex-wrap gap-1">
                            {template.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-100 text-[10px] text-gray-600 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: hoveredTemplate === template.id ? 1 : 0 }}
                          className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-200" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Preview Button */}
        <motion.button
          className="h-9 px-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Preview</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          className="h-9 px-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share</span>
        </motion.button>

        {/* Email Button */}
        <motion.button
          className="h-9 px-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm font-medium">Email</span>
        </motion.button>

        {/* Export PDF Button */}
        <motion.button
          onClick={onExport}
          className="h-9 px-5 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Export PDF</span>
          <Sparkles className="w-3 h-3" />
        </motion.button>
      </div>
    </div>
  )
}