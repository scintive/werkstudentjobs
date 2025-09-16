'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Code,
  CheckCircle,
  RefreshCw,
  Wand2,
  Star,
  Globe,
  X,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Calendar,
  ChevronRight,
  ChevronDown,
  Settings,
  Shield,
  Crown,
  Diamond,
  Trophy,
  BookOpen,
  Users,
  Heart,
  Target,
  Lightbulb,
  Megaphone,
  PenTool
} from 'lucide-react'
import { useResumeActions } from '@/lib/contexts/ResumeContext'
import { useSupabaseResumeContext, useSupabaseResumeActions } from '@/lib/contexts/SupabaseResumeContext'
import { cn } from '@/lib/utils'
import { EnhancedRichText } from './enhanced-rich-text'
import { SimpleTemplateDropdown } from './SimpleTemplateDropdown'
import { EnhancedSkillsManager } from './EnhancedSkillsManager'
import { useUnifiedSuggestions } from '@/hooks/useUnifiedSuggestions'
import { SuggestionIndicator, SuggestionBadge } from './SuggestionIndicator'

// Custom Section Templates
const CUSTOM_SECTION_TEMPLATES = {
  'Awards & Recognition': {
    icon: <Trophy className="w-4 h-4" />,
    fields: ['Award Title', 'Organization', 'Date', 'Description'],
    color: 'from-yellow-500 to-amber-500'
  },
  'Publications': {
    icon: <BookOpen className="w-4 h-4" />,
    fields: ['Publication Title', 'Publisher/Journal', 'Date', 'URL/DOI'],
    color: 'from-blue-500 to-indigo-500'
  },
  'Volunteer Experience': {
    icon: <Heart className="w-4 h-4" />,
    fields: ['Organization', 'Role', 'Duration', 'Impact/Contribution'],
    color: 'from-pink-500 to-rose-500'
  },
  'Professional Memberships': {
    icon: <Users className="w-4 h-4" />,
    fields: ['Organization Name', 'Membership Type', 'Since', 'Benefits/Activities'],
    color: 'from-purple-500 to-violet-500'
  },
  'Leadership Experience': {
    icon: <Users className="w-4 h-4" />,
    fields: ['Position', 'Organization', 'Duration', 'Achievement'],
    color: 'from-indigo-500 to-purple-500'
  },
  'Community Involvement': {
    icon: <Heart className="w-4 h-4" />,
    fields: ['Role', 'Organization', 'Duration', 'Contribution'],
    color: 'from-green-500 to-teal-500'
  },
  'Research Experience': {
    icon: <BookOpen className="w-4 h-4" />,
    fields: ['Title', 'Institution', 'Duration', 'Description'],
    color: 'from-purple-500 to-pink-500'
  },
  'Speaking Engagements': {
    icon: <Megaphone className="w-4 h-4" />,
    fields: ['Event/Conference', 'Topic', 'Date', 'Audience Size'],
    color: 'from-green-500 to-teal-500'
  },
  'Hobbies & Interests': {
    icon: <Star className="w-4 h-4" />,
    fields: ['Interest Category', 'Specific Activities', 'Level', 'Achievements'],
    color: 'from-orange-500 to-red-500'
  }
}

// Clean Section Card Component
interface SectionCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string | number
  onAdd?: () => void
  className?: string
  color?: string
  isExpanded?: boolean
  onToggle?: () => void
}

const SectionCard = ({ 
  title, 
  icon, 
  children, 
  badge,
  onAdd,
  className,
  color = 'from-gray-600 to-gray-700',
  isExpanded = true,
  onToggle
}: SectionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div 
        className={cn(
          "p-4 transition-all duration-200",
          isExpanded ? "border-b border-gray-100" : "",
          onToggle ? "cursor-pointer hover:bg-gray-50" : ""
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", color)}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && (
                <span className="text-xs text-gray-500">{badge} items</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAdd && isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {onToggle && (
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="p-1"
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            )}
          </div>
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
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Clean Input Component
const CleanInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  multiline = false,
  icon
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  icon?: React.ReactNode
}) => {
  const Component = multiline ? 'textarea' : 'input'
  
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <Component
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
            "transition-all duration-200 text-gray-900",
            icon && "pl-10",
            multiline && "min-h-[100px] resize-none"
          )}
        />
      </div>
    </div>
  )
}

// Template Tabs
const TemplateTabs = ({ 
  templates, 
  activeTemplate, 
  onChange 
}: {
  templates: string[]
  activeTemplate: string
  onChange: (template: string) => void
}) => {
  const icons = {
    swiss: <Diamond className="w-3 h-3" />,
    impact: <Sparkles className="w-3 h-3" />,
    classic: <Crown className="w-3 h-3" />,
    professional: <Shield className="w-3 h-3" />
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {templates.map((template) => (
        <button
          key={template}
          onClick={() => onChange(template)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
            activeTemplate === template
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {icons[template as keyof typeof icons]}
          {template.charAt(0).toUpperCase() + template.slice(1)}
        </button>
      ))}
    </div>
  )
}

// Skill Pill Component
const SkillPill = ({ 
  skill, 
  onRemove, 
  color = 'blue' 
}: {
  skill: string
  onRemove: () => void
  color?: string
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "group inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors",
        colors[color as keyof typeof colors]
      )}
    >
      <span>{skill}</span>
      <button
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

interface PerfectStudioProps {
  userProfile?: any
  organizedSkills?: any
  mode?: 'base' | 'tailor'
  variantId?: string
  jobId?: string
  jobData?: any
  baseResumeId?: string
}

export function PerfectStudio({ 
  userProfile: initialUserProfile, 
  organizedSkills,
  mode = 'base',
  variantId,
  jobId,
  jobData,
  baseResumeId
}: PerfectStudioProps) {
  const { resumeData } = useSupabaseResumeContext()
  const { 
    updatePersonalInfo, 
    updateField,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    saveNow
  } = useSupabaseResumeActions()

  const [localData, setLocalData] = React.useState(resumeData)
  const [userProfile, setUserProfile] = React.useState(initialUserProfile) // LOCAL STATE FOR LANGUAGE EDITING
  const [activeTemplate, setActiveTemplate] = React.useState('swiss')
  
  // Update local userProfile when prop changes
  React.useEffect(() => {
    if (initialUserProfile) {
      setUserProfile(initialUserProfile)
    }
  }, [initialUserProfile])

  // Save template preference when it changes
  React.useEffect(() => {
    if (activeTemplate) {
      saveNow(activeTemplate)
    }
  }, [activeTemplate, saveNow])
  const [previewHtml, setPreviewHtml] = React.useState('')
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false)
  const [selectedCustomSection, setSelectedCustomSection] = React.useState<string | null>(null)
  
  // Collapsible sections state - Personal Info expanded by default
  const [expandedSections, setExpandedSections] = React.useState({
    personal: true,
    summary: false,
    skills: false,
    experience: false,
    education: false,
    projects: false,
    certifications: false,
    custom: false,
    languages: false
  })
  
  // Toggle function for sections
  const toggleSection = (sectionKey: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }
  
  const [showSkillLevelsInResume, setShowSkillLevelsInResume] = React.useState(false)
  const [newSkillInput, setNewSkillInput] = React.useState({
    technical: '',
    tools: '',
    soft_skills: '',
    languages: ''
  })
  const debounceTimer = React.useRef<NodeJS.Timeout>()
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const savedScrollPosition = React.useRef<{ x: number, y: number }>({ x: 0, y: 0 })
  
  // Unified Suggestions System for Tailor Mode
  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    acceptSuggestion,
    declineSuggestion,
    getSuggestionsForSection,
    getSuggestionForField,
    getStats,
    generateSuggestionsForSection,
    isEnabled: suggestionsEnabled,
    hasChanges
  } = useUnifiedSuggestions({
    mode,
    variantId,
    jobId,
    baseResumeId,
    onDataChange: (suggestion) => {
      // Apply the suggestion to local data
      handleSuggestionApply(suggestion)
    }
  })
  
  // Handle applying a suggestion to the actual data
  const handleSuggestionApply = (suggestion: any) => {
    // Update localData based on suggestion type and section
    setLocalData(prev => {
      const updated = { ...prev }
      
      switch(suggestion.section) {
        case 'title':
          if (updated.personalInfo) {
            updated.personalInfo = {
              ...updated.personalInfo,
              title: suggestion.suggested
            }
          }
          break
          
        case 'summary':
          updated.professionalSummary = suggestion.suggested
          break
          
        case 'experience':
          // Handle experience bullet points
          if (suggestion.targetPath && suggestion.targetIndex !== undefined) {
            const [, expIndex, , bulletIndex] = suggestion.targetPath.split('.')
            if (updated.experience && updated.experience[expIndex]) {
              const exp = updated.experience[expIndex]
              if (exp.bullets && exp.bullets[bulletIndex]) {
                exp.bullets[bulletIndex] = suggestion.suggested
              }
            }
          }
          break
          
        case 'projects':
          // Handle project descriptions
          if (suggestion.targetPath && suggestion.targetIndex !== undefined) {
            const [, projIndex] = suggestion.targetPath.split('.')
            if (updated.projects && updated.projects[projIndex]) {
              updated.projects[projIndex] = {
                ...updated.projects[projIndex],
                description: suggestion.suggested
              }
            }
          }
          break
          
        case 'skills':
          // Handle skill additions/removals
          if (suggestion.type === 'skill_add' && suggestion.targetPath) {
            const category = suggestion.targetPath
            if (!updated.skills) updated.skills = {}
            if (!updated.skills[category]) updated.skills[category] = []
            if (!updated.skills[category].includes(suggestion.suggested)) {
              updated.skills[category] = [...updated.skills[category], suggestion.suggested]
            }
          } else if (suggestion.type === 'skill_remove' && suggestion.targetPath) {
            const category = suggestion.targetPath
            if (updated.skills && updated.skills[category]) {
              updated.skills[category] = updated.skills[category].filter(
                (skill: string) => skill !== suggestion.original
              )
            }
          }
          break
      }
      
      return updated
    })
  }

  // Real-time preview generation
  React.useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      setIsGeneratingPreview(true)
      
      // Save current scroll position before updating
      if (iframeRef.current?.contentWindow) {
        try {
          savedScrollPosition.current = {
            x: iframeRef.current.contentWindow.scrollX,
            y: iframeRef.current.contentWindow.scrollY
          }
        } catch (error) {
          // Ignore cross-origin errors
        }
      }
      
      // Update global context
      Object.keys(localData).forEach(key => {
        if (key === 'personalInfo') {
          updatePersonalInfo(localData.personalInfo)
        } else {
          updateField(key as any, localData[key as keyof typeof localData])
        }
      })

      // Generate preview
      try {
        const response = await fetch('/api/resume/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeData: localData,
            template: activeTemplate,
            userProfile: userProfile, // Pass userProfile for languages
            showSkillLevelsInResume: showSkillLevelsInResume // Pass skill level toggle
          })
        })

        if (response.ok) {
          const data = await response.json()
          setPreviewHtml(data.html)
        }
      } catch (error) {
        console.error('Preview generation failed:', error)
      } finally {
        setIsGeneratingPreview(false)
      }
    }, 800)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [localData, activeTemplate, showSkillLevelsInResume, userProfile])

  // Restore scroll position after preview HTML updates
  React.useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const iframe = iframeRef.current
      const restoreScroll = () => {
        if (iframe.contentWindow && savedScrollPosition.current) {
          try {
            iframe.contentWindow.scrollTo(
              savedScrollPosition.current.x,
              savedScrollPosition.current.y
            )
          } catch (error) {
            // Ignore cross-origin errors
          }
        }
      }
      
      // Wait for iframe to load content, then restore scroll
      iframe.onload = () => {
        setTimeout(restoreScroll, 100)
      }
      
      // Also try to restore immediately in case iframe is already loaded
      setTimeout(restoreScroll, 100)
    }
  }, [previewHtml])

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/resume/pdf-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: localData,
          template: activeTemplate,
          userProfile: userProfile,
          showSkillLevelsInResume: showSkillLevelsInResume
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${localData.personalInfo.name || 'resume'}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }

  // Add skill with enter key
  const handleAddSkill = (category: keyof typeof newSkillInput) => {
    const skill = newSkillInput[category].trim()
    if (skill) {
      setLocalData({
        ...localData,
        skills: {
          ...localData.skills,
          [category]: [...(localData.skills[category] || []), skill]
        }
      })
      setNewSkillInput({ ...newSkillInput, [category]: '' })
    }
  }

  // Remove Education
  const handleRemoveEducation = (index: number) => {
    setLocalData({
      ...localData,
      education: localData.education.filter((_, i) => i !== index)
    })
  }

  // Add Custom Section
  const handleAddCustomSection = (templateName: string) => {
    const template = CUSTOM_SECTION_TEMPLATES[templateName as keyof typeof CUSTOM_SECTION_TEMPLATES]
    const newSection = {
      id: `custom-${Date.now()}`,
      title: templateName,
      type: 'custom',
      items: [{
        field1: '',
        field2: '',
        field3: '',
        field4: ''
      }]
    }
    
    setLocalData({
      ...localData,
      customSections: [...(localData.customSections || []), newSection]
    })
    setSelectedCustomSection(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Resume Studio</h1>
                <p className="text-xs text-gray-500">Professional Resume Builder</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              
              <SimpleTemplateDropdown
                activeTemplate={activeTemplate}
                onChange={setActiveTemplate}
              />
              
              <motion.button
                onClick={exportToPDF}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-base hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-3 border-0"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Usage */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Editor Panel - 40% */}
        <div className="w-[40%] overflow-y-auto bg-white border-r border-gray-200">
          <div className="p-6 space-y-6">
            
            {/* Personal Information */}
            <SectionCard
              title="Personal Information"
              icon={<User className="w-4 h-4" />}
              color="from-blue-500 to-cyan-500"
              isExpanded={expandedSections.personal}
              onToggle={() => toggleSection('personal')}
            >
              <div className="grid grid-cols-2 gap-4">
                <CleanInput
                  label="Full Name"
                  value={localData.personalInfo.name}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, name: value }
                  })}
                  icon={<User className="w-4 h-4" />}
                />
                <CleanInput
                  label="Professional Title"
                  value={localData.professionalTitle}
                  onChange={(value) => setLocalData({
                    ...localData,
                    professionalTitle: value
                  })}
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <CleanInput
                  label="Email"
                  value={localData.personalInfo.email}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, email: value }
                  })}
                  icon={<Mail className="w-4 h-4" />}
                />
                <CleanInput
                  label="Phone"
                  value={localData.personalInfo.phone}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, phone: value }
                  })}
                  icon={<Phone className="w-4 h-4" />}
                />
                <CleanInput
                  label="Location"
                  value={localData.personalInfo.location}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, location: value }
                  })}
                  icon={<MapPin className="w-4 h-4" />}
                />
                <CleanInput
                  label="LinkedIn Profile"
                  value={localData.personalInfo.linkedin || ''}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, linkedin: value }
                  })}
                  placeholder="e.g., linkedin.com/in/yourprofile"
                  icon={<Linkedin className="w-4 h-4" />}
                />
                <CleanInput
                  label="Portfolio/Website"
                  value={localData.personalInfo.website || ''}
                  onChange={(value) => setLocalData({
                    ...localData,
                    personalInfo: { ...localData.personalInfo, website: value }
                  })}
                  placeholder="e.g., yourportfolio.com or github.com/username"
                  icon={<Globe className="w-4 h-4" />}
                />
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Professional Summary
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Show suggestion badge in tailor mode */}
                    {suggestionsEnabled && (
                      <SuggestionBadge
                        count={getSuggestionsForSection('summary').length}
                        section="summary"
                      />
                    )}
                    <button
                      onClick={() => setLocalData({
                        ...localData,
                        enableProfessionalSummary: !localData.enableProfessionalSummary
                      })}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md font-medium transition-all duration-200",
                        localData.enableProfessionalSummary
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {localData.enableProfessionalSummary ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
                {localData.enableProfessionalSummary && (
                  <div className="space-y-2">
                    {/* Show suggestion for summary if available */}
                    {suggestionsEnabled && getSuggestionForField('summary') && (
                      <SuggestionIndicator
                        suggestion={getSuggestionForField('summary')!}
                        onAccept={acceptSuggestion}
                        onDecline={declineSuggestion}
                      />
                    )}
                    <EnhancedRichText
                      value={localData.professionalSummary}
                      onChange={(value) => setLocalData({
                        ...localData,
                        professionalSummary: value
                      })}
                      multiline
                      showHighlight
                      placeholder="Write a compelling professional summary..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
                {!localData.enableProfessionalSummary && (
                  <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                    Professional summary is disabled and won't appear on your resume.
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Experience */}
            <SectionCard
              title="Professional Experience"
              icon={<Briefcase className="w-4 h-4" />}
              badge={localData.experience.length}
              color="from-purple-500 to-pink-500"
              isExpanded={expandedSections.experience}
              onToggle={() => toggleSection('experience')}
              onAdd={() => {
                setLocalData({
                  ...localData,
                  experience: [...localData.experience, {
                    position: '',
                    company: '',
                    duration: '',
                    achievements: ['']
                  }]
                })
              }}
            >
              <div className="space-y-4">
                {localData.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    <button
                      onClick={() => {
                        setLocalData({
                          ...localData,
                          experience: localData.experience.filter((_, i) => i !== index)
                        })
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <CleanInput
                        label="Position"
                        value={exp.position}
                        onChange={(value) => {
                          const newExp = [...localData.experience]
                          newExp[index].position = value
                          setLocalData({ ...localData, experience: newExp })
                        }}
                      />
                      <CleanInput
                        label="Company"
                        value={exp.company}
                        onChange={(value) => {
                          const newExp = [...localData.experience]
                          newExp[index].company = value
                          setLocalData({ ...localData, experience: newExp })
                        }}
                      />
                    </div>
                    
                    <CleanInput
                      label="Duration"
                      value={exp.duration}
                      onChange={(value) => {
                        const newExp = [...localData.experience]
                        newExp[index].duration = value
                        setLocalData({ ...localData, experience: newExp })
                      }}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Responsibilities & Achievements
                        {/* Show suggestion count for this experience */}
                        {suggestionsEnabled && (
                          <span className="ml-2">
                            <SuggestionBadge
                              count={getSuggestionsForSection('experience').filter(s => 
                                s.targetPath?.startsWith(`experience.${index}`)
                              ).length}
                              section={`experience-${index}`}
                            />
                          </span>
                        )}
                      </label>
                      {exp.achievements?.map((achievement, achIndex) => {
                        const suggestionPath = `experience.${index}.achievements.${achIndex}`
                        const suggestion = suggestionsEnabled ? getSuggestionForField(suggestionPath) : null
                        
                        return (
                          <div key={achIndex} className="space-y-1 mb-2">
                            {/* Show suggestion indicator if available */}
                            {suggestion && (
                              <SuggestionIndicator
                                suggestion={suggestion}
                                onAccept={acceptSuggestion}
                                onDecline={declineSuggestion}
                                compact={false}
                              />
                            )}
                            <div className="flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <EnhancedRichText
                                value={achievement}
                                onChange={(value) => {
                                  const newExp = [...localData.experience]
                                  newExp[index].achievements[achIndex] = value
                                  setLocalData({ ...localData, experience: newExp })
                                }}
                                showHighlight
                                placeholder="Describe key responsibility or achievement..."
                                className="flex-1"
                              />
                              <button
                                onClick={() => {
                                  const newExp = [...localData.experience]
                                  newExp[index].achievements = newExp[index].achievements.filter((_, i) => i !== achIndex)
                                  setLocalData({ ...localData, experience: newExp })
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <button
                        onClick={() => {
                          const newExp = [...localData.experience]
                          newExp[index].achievements = [...(newExp[index].achievements || []), '']
                          setLocalData({ ...localData, experience: newExp })
                        }}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Responsibility
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Projects */}
            <SectionCard
              title="Projects"
              icon={<Code className="w-4 h-4" />}
              badge={localData.projects?.length || 0}
              isExpanded={expandedSections.projects}
              onToggle={() => toggleSection('projects')}
              color="from-orange-500 to-red-500"
              onAdd={() => {
                setLocalData({
                  ...localData,
                  projects: [...(localData.projects || []), {
                    name: '',
                    description: '',
                    date: '',
                    technologies: []
                  }]
                })
              }}
            >
              <div className="space-y-4">
                {localData.projects?.map((project, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    <button
                      onClick={() => {
                        setLocalData({
                          ...localData,
                          projects: localData.projects?.filter((_, i) => i !== index) || []
                        })
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <CleanInput
                        label="Project Name"
                        value={project.name}
                        onChange={(value) => {
                          const newProjects = [...(localData.projects || [])]
                          newProjects[index].name = value
                          setLocalData({ ...localData, projects: newProjects })
                        }}
                        placeholder="e.g., E-commerce Platform"
                      />
                      <CleanInput
                        label="Date/Duration"
                        value={project.date}
                        onChange={(value) => {
                          const newProjects = [...(localData.projects || [])]
                          newProjects[index].date = value
                          setLocalData({ ...localData, projects: newProjects })
                        }}
                        placeholder="e.g., Jan 2024 - Mar 2024"
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                        Description
                        {/* Show suggestion badge for this project */}
                        {suggestionsEnabled && (
                          <span className="ml-2">
                            <SuggestionBadge
                              count={getSuggestionsForSection('projects').filter(s => 
                                s.targetPath === `projects.${index}`
                              ).length}
                              section={`project-${index}`}
                            />
                          </span>
                        )}
                      </label>
                      {/* Show suggestion indicator if available */}
                      {suggestionsEnabled && getSuggestionForField(`projects.${index}`) && (
                        <div className="mb-2">
                          <SuggestionIndicator
                            suggestion={getSuggestionForField(`projects.${index}`)!}
                            onAccept={acceptSuggestion}
                            onDecline={declineSuggestion}
                            compact={false}
                          />
                        </div>
                      )}
                      <CleanInput
                        value={project.description}
                        onChange={(value) => {
                          const newProjects = [...(localData.projects || [])]
                          newProjects[index].description = value
                          setLocalData({ ...localData, projects: newProjects })
                        }}
                        placeholder="Brief description of the project..."
                        multiline
                      />
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Technologies Used
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {project.technologies?.map((tech, techIndex) => (
                          <span key={techIndex} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs">
                            {tech}
                            <button
                              onClick={() => {
                                const newProjects = [...(localData.projects || [])]
                                newProjects[index].technologies = newProjects[index].technologies?.filter((_, i) => i !== techIndex) || []
                                setLocalData({ ...localData, projects: newProjects })
                              }}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add technology (press Enter)"
                          className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const newProjects = [...(localData.projects || [])]
                              newProjects[index].technologies = [...(newProjects[index].technologies || []), e.target.value.trim()]
                              setLocalData({ ...localData, projects: newProjects })
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Enhanced Skills Manager */}
            <SectionCard
              title="Skills & Languages"
              icon={<Sparkles className="w-4 h-4" />}
              isExpanded={expandedSections.skills}
              onToggle={() => toggleSection('skills')}
              color="from-emerald-500 to-teal-500"
            >
              <EnhancedSkillsManager
                skills={localData.skills}
                onSkillsChange={(updatedSkills) => {
                  console.log('🎯 Skills change callback triggered')
                  setLocalData(prevData => ({
                    ...prevData,
                    skills: updatedSkills,
                    // Preserve languages from userProfile to prevent reset
                    languages: userProfile?.languages || prevData.languages || []
                  }))
                  console.log('🎯 Updated localData with skills, preserved languages from userProfile')
                }}
                userProfile={userProfile}
                organizedSkills={organizedSkills} // Pass pre-organized skills to avoid separate API call
                languages={userProfile?.languages || []}
                // Pass suggestion props for tailor mode
                suggestions={suggestionsEnabled ? getSuggestionsForSection('skills') : []}
                onAcceptSuggestion={acceptSuggestion}
                onDeclineSuggestion={declineSuggestion}
                mode={mode}
                onLanguagesChange={(updatedLanguages) => {
                  console.log('🌍 Language change callback triggered:', updatedLanguages)
                  // Update both userProfile AND localData to keep them in sync
                  if (userProfile) {
                    const newUserProfile = { ...userProfile, languages: updatedLanguages }
                    setUserProfile(newUserProfile)
                    console.log('🌍 Updated userProfile with new languages:', newUserProfile.languages)
                  }
                  // ALSO update localData to prevent reset during skills updates
                  setLocalData({
                    ...localData,
                    languages: updatedLanguages
                  })
                  console.log('🌍 Also updated localData languages to prevent reset')
                }}
                showSkillLevelsInResume={showSkillLevelsInResume}
                onShowSkillLevelsChange={setShowSkillLevelsInResume}
              />
            </SectionCard>

            {/* Certifications */}
            <SectionCard
              title="Certifications"
              icon={<Award className="w-4 h-4" />}
              badge={localData.certifications?.length || 0}
              isExpanded={expandedSections.certifications}
              onToggle={() => toggleSection('certifications')}
              color="from-indigo-500 to-purple-500"
              onAdd={() => {
                setLocalData({
                  ...localData,
                  certifications: [...(localData.certifications || []), {
                    name: '',
                    issuer: '',
                    date: ''
                  }]
                })
              }}
            >
              <div className="space-y-3">
                {localData.certifications?.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    <button
                      onClick={() => {
                        setLocalData({
                          ...localData,
                          certifications: localData.certifications?.filter((_, i) => i !== index) || []
                        })
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <CleanInput
                        label="Certification Name"
                        value={cert.name}
                        onChange={(value) => {
                          const newCerts = [...(localData.certifications || [])]
                          newCerts[index].name = value
                          setLocalData({ ...localData, certifications: newCerts })
                        }}
                        placeholder="e.g., AWS Certified Developer"
                      />
                      <CleanInput
                        label="Issuing Organization"
                        value={cert.issuer}
                        onChange={(value) => {
                          const newCerts = [...(localData.certifications || [])]
                          newCerts[index].issuer = value
                          setLocalData({ ...localData, certifications: newCerts })
                        }}
                        placeholder="e.g., Amazon Web Services"
                      />
                      <CleanInput
                        label="Date Obtained"
                        value={cert.date}
                        onChange={(value) => {
                          const newCerts = [...(localData.certifications || [])]
                          newCerts[index].date = value
                          setLocalData({ ...localData, certifications: newCerts })
                        }}
                        placeholder="e.g., Jan 2024"
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Education */}
            <SectionCard
              title="Education"
              icon={<GraduationCap className="w-4 h-4" />}
              badge={localData.education.length}
              isExpanded={expandedSections.education}
              onToggle={() => toggleSection('education')}
              color="from-amber-500 to-yellow-500"
              onAdd={() => {
                setLocalData({
                  ...localData,
                  education: [...localData.education, {
                    degree: '',
                    field_of_study: '',
                    institution: '',
                    duration: ''
                  }]
                })
              }}
            >
              <div className="space-y-4">
                {localData.education.length > 0 ? (
                  localData.education.map((edu, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg relative group">
                      <button
                        onClick={() => handleRemoveEducation(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CleanInput
                          label="Degree"
                          value={edu.degree}
                          onChange={(value) => {
                            const newEdu = [...localData.education]
                            newEdu[index].degree = value
                            setLocalData({ ...localData, education: newEdu })
                          }}
                          placeholder="e.g., Bachelor of Science"
                        />
                        <CleanInput
                          label="Field of Study"
                          value={edu.field_of_study || edu.field || ''}
                          onChange={(value) => {
                            const newEdu = [...localData.education]
                            newEdu[index].field_of_study = value
                            setLocalData({ ...localData, education: newEdu })
                          }}
                          placeholder="e.g., Computer Science"
                        />
                        <CleanInput
                          label="Institution"
                          value={edu.institution}
                          onChange={(value) => {
                            const newEdu = [...localData.education]
                            newEdu[index].institution = value
                            setLocalData({ ...localData, education: newEdu })
                          }}
                          placeholder="University name"
                        />
                        <CleanInput
                          label="Duration"
                          value={edu.duration || edu.year || ''}
                          onChange={(value) => {
                            const newEdu = [...localData.education]
                            newEdu[index].duration = value
                            setLocalData({ ...localData, education: newEdu })
                          }}
                          placeholder="e.g., 2020-2024"
                          icon={<Calendar className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">No education added yet</p>
                    <button
                      onClick={() => {
                        setLocalData({
                          ...localData,
                          education: [...localData.education, {
                            degree: '',
                            field_of_study: '',
                            institution: '',
                            duration: ''
                          }]
                        })
                      }}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Add your first degree
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Custom Sections - Enhanced Redesign */}
            <div className="relative">
              <motion.button
                whileHover={{ 
                  y: -1,
                  scale: 1.005
                }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedCustomSection(selectedCustomSection ? null : 'show')}
                className="w-full group relative"
              >
                {/* Main Content */}
                <div className="relative bg-white border-2 border-gray-200 rounded-xl p-5 group-hover:border-purple-300 group-hover:shadow-lg transition-all duration-300">
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  
                  <div className="flex items-center gap-4 relative">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-500 group-hover:to-pink-500 flex items-center justify-center transition-all duration-300 relative">
                      <Plus className="w-6 h-6 text-purple-600 group-hover:text-white transition-all duration-300" />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-300 text-lg">
                        ✨ Add Custom Section
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors duration-300">
                        Awards, publications, volunteer work & more
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <motion.div
                      animate={{ 
                        x: selectedCustomSection ? 4 : 0,
                        rotate: selectedCustomSection ? 90 : 0 
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-all duration-300" />
                    </motion.div>
                  </div>
                </div>
              </motion.button>
              
              <AnimatePresence>
                {selectedCustomSection && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Choose Section Type</h3>
                          <p className="text-sm text-gray-600 mt-1">Select a pre-configured section template</p>
                        </div>
                        <button
                          onClick={() => setSelectedCustomSection(null)}
                          className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(CUSTOM_SECTION_TEMPLATES).map(([name, template]) => (
                          <motion.button
                            key={name}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleAddCustomSection(name)}
                            className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all text-left w-full"
                          >
                            <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", template.color)}>
                              {template.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{name}</div>
                              <div className="text-sm text-gray-500">
                                {name === 'Awards & Recognition' && 'Honors, achievements, and recognition'}
                                {name === 'Publications' && 'Articles, papers, and published work'}
                                {name === 'Volunteer Experience' && 'Community service and volunteer work'}
                                {name === 'Languages' && 'Language skills and proficiency levels'}
                                {name === 'Hobbies & Interests' && 'Personal interests and activities'}
                                {name === 'References' && 'Professional references and contacts'}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Render Custom Sections */}
            {localData.customSections?.filter(section => {
              // Filter out Academic Projects - they should be in the main projects section
              const lowerTitle = section.title?.toLowerCase() || '';
              return !(lowerTitle.includes('academic') && lowerTitle.includes('project'));
            }).map((section, sectionIndex) => {
              // Smart template matching for extracted sections
              const findMatchingTemplate = (sectionTitle: string) => {
                // Direct match first
                if (CUSTOM_SECTION_TEMPLATES[sectionTitle as keyof typeof CUSTOM_SECTION_TEMPLATES]) {
                  return CUSTOM_SECTION_TEMPLATES[sectionTitle as keyof typeof CUSTOM_SECTION_TEMPLATES];
                }
                
                // Fuzzy matching for common variations
                const lowerTitle = sectionTitle.toLowerCase();
                
                if (lowerTitle.includes('volunteer')) {
                  return CUSTOM_SECTION_TEMPLATES['Volunteer Experience'];
                }
                if (lowerTitle.includes('leadership')) {
                  return CUSTOM_SECTION_TEMPLATES['Leadership Experience'];
                }
                if (lowerTitle.includes('award') || lowerTitle.includes('honor') || lowerTitle.includes('recognition')) {
                  return CUSTOM_SECTION_TEMPLATES['Awards & Recognition'];
                }
                if (lowerTitle.includes('publication')) {
                  return CUSTOM_SECTION_TEMPLATES['Publications'];
                }
                if (lowerTitle.includes('community')) {
                  return CUSTOM_SECTION_TEMPLATES['Community Involvement'];
                }
                // Skip Academic Projects - they should be in the main projects section
                if (lowerTitle.includes('academic') && lowerTitle.includes('project')) {
                  return null; // Don't create a custom section for academic projects
                }
                if (lowerTitle.includes('research')) {
                  return CUSTOM_SECTION_TEMPLATES['Research Experience'];
                }
                if (lowerTitle.includes('member') || lowerTitle.includes('association')) {
                  return CUSTOM_SECTION_TEMPLATES['Professional Memberships'];
                }
                if (lowerTitle.includes('hobbies') || lowerTitle.includes('interest')) {
                  return CUSTOM_SECTION_TEMPLATES['Hobbies & Interests'];
                }
                
                // Default template for unrecognized sections
                return {
                  icon: <Star className="w-4 h-4" />,
                  fields: ['Title/Name', 'Organization/Context', 'Date/Duration', 'Description/Details'],
                  color: 'from-gray-500 to-gray-600'
                };
              };
              
              const template = findMatchingTemplate(section.title);
              return (
                <SectionCard
                  key={section.id || `custom-section-${sectionIndex}-${section.title}`}
                  title={section.title}
                  icon={template?.icon || <Star className="w-4 h-4" />}
                  badge={section.items?.length || 0}
                  color={template?.color || 'from-gray-500 to-gray-600'}
                  isExpanded={expandedSections.custom}
                  onToggle={() => toggleSection('custom')}
                  onAdd={() => {
                    const newSections = [...localData.customSections]
                    newSections[sectionIndex].items = [
                      ...(newSections[sectionIndex].items || []),
                      { field1: '', field2: '', field3: '', field4: '' }
                    ]
                    setLocalData({ ...localData, customSections: newSections })
                  }}
                >
                  <div className="space-y-3">
                    {section.items?.map((item, itemIndex) => {
                      const fields = template?.fields || ['Field 1', 'Field 2', 'Field 3', 'Field 4']
                      return (
                        <div key={itemIndex} className="p-4 bg-gray-50 rounded-lg relative">
                          <button
                            onClick={() => {
                              const newSections = [...localData.customSections]
                              newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex)
                              setLocalData({ ...localData, customSections: newSections })
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {fields.map((fieldName, fieldIndex) => (
                              <CleanInput
                                key={fieldIndex}
                                label={fieldName}
                                value={item[`field${fieldIndex + 1}` as keyof typeof item] || ''}
                                onChange={(value) => {
                                  const newSections = [...localData.customSections]
                                  newSections[sectionIndex].items[itemIndex][`field${fieldIndex + 1}` as keyof typeof item] = value
                                  setLocalData({ ...localData, customSections: newSections })
                                }}
                                multiline={fieldIndex === 3}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLocalData({
                          ...localData,
                          customSections: localData.customSections.filter((_, i) => i !== sectionIndex)
                        })
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Section
                    </motion.button>
                  </div>
                </SectionCard>
              )
            })}
          </div>
        </div>

        {/* Preview Panel - 60% Full Size */}
        <div className="w-[60%] bg-gray-100 flex items-center justify-center p-4">
          <div className="w-full h-full bg-white shadow-xl overflow-hidden">
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full"
                style={{ 
                  border: 'none',
                  display: 'block',
                  overflow: 'hidden'
                }}
                title="Resume Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="font-semibold text-gray-900 text-lg mb-2">Creating Your Resume</p>
                  <p className="text-gray-500 text-sm">Your preview will appear here</p>
                </div>
              </div>
            )}
          </div>
          
          {isGeneratingPreview && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Updating preview...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}