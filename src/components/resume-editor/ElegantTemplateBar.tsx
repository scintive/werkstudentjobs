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
  ExternalLink,
  Upload
} from 'lucide-react'
import { ShareButtons } from '../share/ShareButtons'
import { useRouter } from 'next/navigation'

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
  onExport,
  resumeId,
  variantId
}: {
  activeTemplate: string
  onChange: (template: string) => void
  onExport?: () => void
  resumeId?: string
  variantId?: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [showShareMenu, setShowShareMenu] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const [uploadState, setUploadState] = React.useState<{
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
    progress: number
    error?: string
  }>({
    status: 'idle',
    progress: 0
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Please upload a PDF file'
      })
      return
    }

    setUploadState({
      status: 'uploading',
      progress: 25
    })

    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 500))

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 50
      }))

      // Call API to extract profile from PDF
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to extract profile from resume')
      }

      const data = await response.json()

      setUploadState(prev => ({
        ...prev,
        progress: 75
      }))

      // Convert profile to ResumeData format (same as upload page)
      const resumeData: any = {
        personalInfo: {
          name: data.profile.personal_details?.name || 'Unknown',
          email: data.profile.personal_details?.contact?.email || '',
          phone: data.profile.personal_details?.contact?.phone || '',
          location: data.profile.personal_details?.contact?.address || '',
          linkedin: data.profile.personal_details?.contact?.linkedin || ''
        },
        professionalTitle: data.profile.professional_title || "Professional",
        professionalSummary: data.profile.professional_summary || "",
        enableProfessionalSummary: !!data.profile.professional_summary,
        skills: {
          technical: data.profile.skills?.technology || [],
          soft_skills: data.profile.skills?.soft_skills || [],
          tools: data.profile.skills?.design || []
        },
        experience: (data.profile.experience || []).map((exp: any) => ({
          company: exp.company,
          position: exp.position,
          duration: exp.duration,
          achievements: exp.responsibilities
        })),
        education: (data.profile.education || []).map((edu: any) => ({
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          institution: edu.institution,
          year: ((edu as any).year ? String((edu as any).year) : edu.duration) || ''
        })),
        projects: (data.profile.projects || []).map((proj: any) => ({
          name: proj.title,
          description: proj.description,
          technologies: [],
          date: "2023"
        })),
        languages: (data.profile.languages || []).map((lang: any) => {
          if (typeof lang === 'string') {
            const match = lang.match(/^(.+?)\s*\((.+?)\)$/)
            if (match) {
              return {
                name: match[1].trim(),
                language: match[1].trim(),
                level: match[2].trim(),
                proficiency: match[2].trim()
              }
            }
            return {
              name: lang,
              language: lang,
              level: 'Not specified',
              proficiency: 'Not specified'
            }
          }
          return {
            name: lang.language || lang.name || '',
            language: lang.language || lang.name || '',
            level: lang.proficiency || lang.level || 'Not specified',
            proficiency: lang.proficiency || lang.level || 'Not specified'
          }
        }),
        certifications: (data.profile.certifications || []).map((cert: any) => ({
          name: cert.title,
          issuer: cert.issuer || '',
          date: cert.date || '',
          description: cert.description || ''
        })),
        customSections: data.profile.custom_sections || []
      }

      // Save using ResumeDataService
      const { ResumeDataService } = await import('@/lib/services/resumeDataService')
      const resumeService = ResumeDataService.getInstance()
      await resumeService.getOrCreateResumeData() // Initialize
      await resumeService.saveResumeData(resumeData, activeTemplate)

      setUploadState({
        status: 'success',
        progress: 100
      })

      // Wait a bit to show success state
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Close modal and reload page to show new resume data
      setShowUploadModal(false)
      setUploadState({ status: 'idle', progress: 0 })

      // Full page reload to ensure all data is refreshed
      window.location.reload()

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to process resume'
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    setShowUploadModal(true)
    setUploadState({ status: 'idle', progress: 0 })
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
          {/* Upload New Resume Button */}
          <button
            onClick={handleUploadClick}
            className="h-10 px-4 flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow text-gray-700 font-medium"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload New Resume</span>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Share Buttons Component */}
          <ShareButtons
            shareType="resume"
            resumeId={resumeId}
            variantId={variantId}
            template={activeTemplate}
          />

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

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => {
                if (uploadState.status !== 'uploading' && uploadState.status !== 'processing') {
                  setShowUploadModal(false)
                }
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Upload New Resume</h3>
                    <p className="text-sm text-gray-500 mt-1">Replace your current resume with a new one</p>
                  </div>
                  {uploadState.status !== 'uploading' && uploadState.status !== 'processing' && (
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Content */}
                {uploadState.status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Resume Uploaded Successfully!</h4>
                    <p className="text-gray-600 text-sm">Your resume has been processed and saved.</p>
                  </motion.div>
                ) : uploadState.status === 'error' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Failed</h4>
                    <p className="text-gray-600 text-sm mb-6">{uploadState.error || 'Something went wrong'}</p>
                    <button
                      onClick={() => setUploadState({ status: 'idle', progress: 0 })}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : uploadState.status === 'uploading' || uploadState.status === 'processing' ? (
                  <div className="py-8">
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 text-center mb-2">
                      {uploadState.status === 'uploading' ? 'Uploading...' : 'Processing Resume...'}
                    </h4>
                    <p className="text-sm text-gray-600 text-center mb-6">
                      {uploadState.status === 'uploading'
                        ? 'Securing your document...'
                        : 'Extracting and structuring your information...'
                      }
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-700">Progress</span>
                        <span className="text-blue-600">{uploadState.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadState.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Upload Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Click to upload PDF</h4>
                      <p className="text-sm text-gray-600">
                        Upload your resume in PDF format
                      </p>
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <h5 className="text-sm font-semibold text-amber-900 mb-1">Warning</h5>
                          <p className="text-xs text-amber-800">
                            Uploading a new resume will replace all your current resume data. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
