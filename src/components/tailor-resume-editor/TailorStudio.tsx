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
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { EnhancedRichText } from '../resume-editor/enhanced-rich-text'
import { SimpleTemplateDropdown } from '../resume-editor/SimpleTemplateDropdown'
import { EnhancedSkillsManager } from '../resume-editor/EnhancedSkillsManager'

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

// Inline Suggestion Component
interface InlineSuggestionProps {
  suggestion: any
  onAccept: () => void
  onReject: () => void
  position: { top: number; left: number }
}

const InlineSuggestion = ({ suggestion, onAccept, onReject, position }: InlineSuggestionProps) => {
  const [expanded, setExpanded] = React.useState(false)
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute z-50 bg-white shadow-lg border border-blue-200 rounded-lg overflow-hidden min-w-80"
        style={{ top: position.top, left: position.left }}
      >
        <div 
          className="p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-900">AI Suggestion</span>
            </div>
            <div className="text-xs text-blue-600">
              {expanded ? '▼' : '▶'}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">ORIGINAL</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {suggestion.original}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-green-600 mb-1">SUGGESTED</div>
                  <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                    {suggestion.suggestion}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">WHY THIS HELPS</div>
                  <div className="text-xs text-blue-700">{suggestion.reason}</div>
                </div>
                
                {suggestion.keywords && suggestion.keywords.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-purple-600 mb-1">KEYWORDS USED</div>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.keywords.map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onAccept}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={onReject}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

interface TailorStudioProps {
  jobData?: any
  userProfile?: any
  organizedSkills?: any
  onDataChange?: (data: any) => void
}

export function TailorStudio({ jobData, userProfile: initialUserProfile, organizedSkills: initialOrganizedSkills, onDataChange }: TailorStudioProps) {
  const [localData, setLocalData] = React.useState<any>(null)
  const [userProfile, setUserProfile] = React.useState(initialUserProfile)
  const [activeTemplate, setActiveTemplate] = React.useState('swiss')
  const [loading, setLoading] = React.useState(true)
  
  // Update local userProfile when prop changes
  React.useEffect(() => {
    if (initialUserProfile) {
      setUserProfile(initialUserProfile)
    }
  }, [initialUserProfile])
  
  const [previewHtml, setPreviewHtml] = React.useState('')
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false)
  const [selectedCustomSection, setSelectedCustomSection] = React.useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = React.useState<any[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<any>(null)
  const [suggestionPosition, setSuggestionPosition] = React.useState({ top: 0, left: 0 })
  const [organizedSkills, setOrganizedSkills] = React.useState<any>(initialOrganizedSkills)
  const [isOrganizing, setIsOrganizing] = React.useState(false)
  
  // Collapsible sections state - All sections expanded by default for better UX
  const [expandedSections, setExpandedSections] = React.useState({
    personal: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    custom: true,
    languages: true
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

  // Convert skills to organized format for EnhancedSkillsManager
  const convertSkillsToOrganizedFormat = React.useCallback((skills: any) => {
    if (!skills) return null
    
    const organized_categories: any = {}
    
    // Map skill categories to organized format
    const categoryMapping: { [key: string]: string } = {
      'technical': 'Technical & Digital',
      'tools': 'Tools & Platforms', 
      'soft_skills': 'Soft Skills',
      'languages': 'Languages'
    }
    
    Object.entries(skills).forEach(([categoryKey, skillArray]: [string, any]) => {
      if (!Array.isArray(skillArray)) return
      
      const displayName = categoryMapping[categoryKey] || categoryKey
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      organized_categories[displayName] = {
        skills: skillArray,
        suggestions: [],
        reasoning: `Essential ${displayName.toLowerCase()} skills for your professional profile`,
        allowProficiency: categoryKey === 'technical' || categoryKey === 'tools'
      }
    })
    
    return {
      organized_categories,
      success: true,
      message: "Skills organized successfully"
    }
  }, [])

  // Debug logging removed

  // Load real user data
  React.useEffect(() => {
    const loadUserData = async () => {
      
      
      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        const response = await fetch('/api/profile/latest', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.resumeData) {
            setLocalData(result.resumeData)
            
            
            if (jobData) {
              generateAISuggestions(result.resumeData)
            }
          }
        } else { }
      } catch (error) {
        
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [jobData])

  // Helper function to add delay between API calls
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  // Generate comprehensive AI suggestions for all resume sections
  const generateAISuggestions = async (data: any) => {
    if (!jobData || !data) return
    
    
    
    const suggestions: any[] = []
    
    try {
      // Prepare full context for highly tailored suggestions
      const fullContext = {
        job: {
          title: jobData.title,
          company: jobData.company_name || 'Company',
          requirements: jobData.requirements || [],
          skills_required: jobData.skills_original || [],
          tools_required: jobData.tools_original || [],
          responsibilities: jobData.responsibilities_original || []
        },
        profile: {
          name: data.personalInfo?.name,
          current_role: data.professionalTitle,
          experiences: data.experience || [],
          projects: data.projects || [],
          skills: data.skills || {},
          education: data.education || [],
          certifications: data.certifications || []
        }
      }

      // 1. Professional Summary Suggestions
      if (data.professionalSummary) {
        try {
          const response = await fetch('/api/jobs/resume/patches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobData.id,
              user_profile_id: 'latest',
              target: {
                section: 'summary',
                target_id: 'professional_summary',
                text: data.professionalSummary
              },
              full_context: fullContext
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const proposed = (result.patch.proposed_text || '').trim()
              const original = (data.professionalSummary || '').trim()
              if (proposed && proposed !== original) {
                suggestions.push({
                  id: 'summary_ai',
                  type: 'summary',
                  section: 'summary',
                  target_id: 'professional_summary',
                  original: data.professionalSummary,
                  suggestion: proposed,
                  reason: result.patch.reasoning,
                  keywords: result.patch.used_keywords || []
                })
              }
            }
          }
        } catch (error) {
          console.error('Failed to generate summary suggestion:', error)
        }
      }

      // Add small delay to prevent rate limiting
      await delay(300)
      
      // 2. Professional Title Suggestions
      if (data.professionalTitle) {
        try {
          const response = await fetch('/api/jobs/resume/patches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobData.id,
              user_profile_id: 'latest',
              target: {
                section: 'title',
                target_id: 'professional_title',
                text: data.professionalTitle
              },
              full_context: fullContext
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const proposed = (result.patch.proposed_text || '').trim()
              const original = (data.professionalTitle || '').trim()
              if (proposed && proposed.toLowerCase() !== original.toLowerCase()) {
                suggestions.push({
                  id: 'title_ai',
                  type: 'title',
                  section: 'title',
                  target_id: 'professional_title',
                  original: data.professionalTitle,
                  suggestion: proposed,
                  reason: result.patch.reasoning,
                  keywords: result.patch.used_keywords || []
                })
              }
            }
          }
        } catch (error) {
          console.error('Failed to generate title suggestion:', error)
        }
      }

      // 3. Experience Bullet Suggestions
      if (data.experience && Array.isArray(data.experience)) {
        for (let expIndex = 0; expIndex < data.experience.length; expIndex++) {
          const exp = data.experience[expIndex]
          if (exp.achievements && Array.isArray(exp.achievements)) {
            for (let achIndex = 0; achIndex < exp.achievements.length; achIndex++) {
              const achievement = exp.achievements[achIndex]
              if (achievement && achievement.trim()) {
                try {
                  const response = await fetch('/api/jobs/resume/patches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      job_id: jobData.id,
                      user_profile_id: 'latest',
                      target: {
                        section: 'experience',
                        target_id: `exp_${expIndex}_ach_${achIndex}`,
                        text: achievement
                      },
                      full_context: {
                        ...fullContext,
                        current_experience: {
                          position: exp.position,
                          company: exp.company,
                          duration: exp.duration
                        }
                      }
                    })
                  })
                  
                  if (response.ok) {
                    const result = await response.json()
                    if (result.success) {
                      const proposed = (result.patch.proposed_text || '').trim()
                      const original = (achievement || '').trim()
                      if (proposed && proposed !== original) {
                        suggestions.push({
                          id: `exp_${expIndex}_ach_${achIndex}_ai`,
                          type: 'experience_bullet',
                          section: 'experience',
                          target_id: `exp_${expIndex}_ach_${achIndex}`,
                          experience_index: expIndex,
                          achievement_index: achIndex,
                          original: achievement,
                          suggestion: proposed,
                          reason: result.patch.reasoning,
                          keywords: result.patch.used_keywords || []
                        })
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Failed to generate suggestion for experience ${expIndex}, achievement ${achIndex}:`, error)
                }
              }
            }
          }
        }
      }

      // 4. Skills Suggestions
      if (data.skills && Object.keys(data.skills).length > 0) {
        try {
          const response = await fetch('/api/jobs/resume/patches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobData.id,
              user_profile_id: 'latest',
              target: {
                section: 'skills',
                target_id: 'all_skills',
                text: JSON.stringify(data.skills)
              },
              full_context: fullContext
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const proposed = result.patch.proposed_skills || null
              const changed = proposed && JSON.stringify(proposed) !== JSON.stringify(data.skills)
              if (changed) {
                suggestions.push({
                  id: 'skills_ai',
                  type: 'skills',
                  section: 'skills',
                  target_id: 'all_skills',
                  original: data.skills,
                  suggestion: proposed,
                  reason: result.patch.reasoning,
                  keywords: result.patch.used_keywords || []
                })
              }
            }
          }
        } catch (error) {
          console.error('Failed to generate skills suggestions:', error)
        }
      }

      // 5. Project Description Suggestions
      if (data.projects && Array.isArray(data.projects)) {
        for (let projIndex = 0; projIndex < data.projects.length; projIndex++) {
          const project = data.projects[projIndex]
          if (project.description && project.description.trim()) {
            try {
              const response = await fetch('/api/jobs/resume/patches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  job_id: jobData.id,
                  user_profile_id: 'latest',
                  target: {
                    section: 'projects',
                    target_id: `project_${projIndex}`,
                    text: project.description
                  },
                  full_context: {
                    ...fullContext,
                    current_project: {
                      name: project.name,
                      date: project.date,
                      technologies: project.technologies
                    }
                  }
                })
              })
              
              if (response.ok) {
                const result = await response.json()
                if (result.success) {
                  const proposed = (result.patch.proposed_text || '').trim()
                  const original = (project.description || '').trim()
                  if (proposed && proposed !== original) {
                    suggestions.push({
                      id: `project_${projIndex}_ai`,
                      type: 'project_description',
                      section: 'projects',
                      target_id: `project_${projIndex}`,
                      project_index: projIndex,
                      original: project.description,
                      suggestion: proposed,
                      reason: result.patch.reasoning,
                      keywords: result.patch.used_keywords || []
                    })
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to generate suggestion for project ${projIndex}:`, error)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error generating AI suggestions:', error)
    }
    
    setAiSuggestions(suggestions)
    console.log('🤖 Generated', suggestions.length, 'comprehensive AI suggestions')
  }
  
  // Real-time preview generation with AI suggestions overlay
  React.useEffect(() => {
    if (!localData) return
    
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
      
      try {
        const response = await fetch('/api/resume/preview', {
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
          const data = await response.json()
          let htmlWithMarkers = data.html
          
          // Add suggestion markers to HTML for clickable review
          aiSuggestions.forEach(suggestion => {
            const marker = `data-suggestion-id="${suggestion.id}"`
            const className = 'has-suggestion'

            // Replace only the first occurrence of the original text to avoid over-highlighting
            const wrapFirstOccurrence = (haystack: string, needle: string) => {
              if (!needle || typeof needle !== 'string') return haystack
              const idx = haystack.indexOf(needle)
              if (idx === -1) return haystack
              return (
                haystack.substring(0, idx) +
                `<span ${marker} class="${className}">` +
                needle +
                '</span>' +
                haystack.substring(idx + needle.length)
              )
            }

            if (suggestion.original && typeof suggestion.original === 'string') {
              // Summary, title, experience bullets, project descriptions all carry original text
              htmlWithMarkers = wrapFirstOccurrence(htmlWithMarkers, suggestion.original)
            }
          })
          
          setPreviewHtml(htmlWithMarkers)
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
  }, [localData, activeTemplate, showSkillLevelsInResume, userProfile, aiSuggestions])
  
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
  
  // Handle suggestion clicks in preview
  React.useEffect(() => {
    if (!previewHtml || !iframeRef.current) return
    
    const iframe = iframeRef.current
    const handleIframeLoad = () => {
      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) return
      
      // Add click listeners to suggestion markers
      const suggestionElements = iframeDoc.querySelectorAll('.has-suggestion')
      
      suggestionElements.forEach(element => {
        element.addEventListener('click', (e) => {
          const suggestionId = element.getAttribute('data-suggestion-id')
          const suggestion = aiSuggestions.find(s => s.id === suggestionId)
          
          if (suggestion) {
            const rect = element.getBoundingClientRect()
            const iframeRect = iframe.getBoundingClientRect()
            
            setSuggestionPosition({
              top: iframeRect.top + rect.top + rect.height + 5,
              left: iframeRect.left + rect.left
            })
            setSelectedSuggestion(suggestion)
          }
        })
        
        // Add visual styling
        element.style.cursor = 'pointer'
        element.style.backgroundColor = '#dbeafe'
        element.style.borderBottom = '2px solid #3b82f6'
        element.style.padding = '2px 4px'
        element.style.borderRadius = '3px'
      })
    }
    
    iframe.addEventListener('load', handleIframeLoad)
    
    return () => {
      iframe.removeEventListener('load', handleIframeLoad)
    }
  }, [previewHtml, aiSuggestions])

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

  // Compute skill diffs for any 'skills' suggestion
  const skillsSuggestion = React.useMemo(() => aiSuggestions.find(s => s.type === 'skills'), [aiSuggestions])
  const skillDiff = React.useMemo(() => {
    if (!skillsSuggestion || !skillsSuggestion.suggestion || !localData?.skills) return null
    const proposed = skillsSuggestion.suggestion as Record<string, any[]>
    const current = localData.skills as Record<string, any[]>
    const result: { added: Record<string, string[]>; removed: Record<string, string[]> } = { added: {}, removed: {} }
    const allCats = new Set([...Object.keys(proposed || {}), ...Object.keys(current || {})])
    allCats.forEach(cat => {
      const p = (proposed[cat] || []).map((x:any) => (typeof x === 'string' ? x : x.skill)).filter(Boolean)
      const c = (current[cat] || []).map((x:any) => (typeof x === 'string' ? x : x.skill)).filter(Boolean)
      const add = p.filter(x => !c.includes(x))
      const rem = c.filter(x => !p.includes(x))
      if (add.length) result.added[cat] = add
      if (rem.length) result.removed[cat] = rem
    })
    return result
  }, [skillsSuggestion, localData])

  const applySkillsSuggestion = () => {
    if (!skillsSuggestion?.suggestion) return
    const proposed = skillsSuggestion.suggestion
    setLocalData(prev => ({ ...prev, skills: proposed }))
  }

  const addSkill = (category: string, skill: string) => {
    setLocalData(prev => {
      const prevCat = (prev.skills as any)?.[category] || []
      const exists = prevCat.some((x:any) => (typeof x === 'string' ? x : x.skill) === skill)
      if (exists) return prev
      const updated = Array.isArray(prevCat) ? [...prevCat, skill] : [skill]
      return { ...prev, skills: { ...prev.skills, [category]: updated } }
    })
  }

  const removeSkill = (category: string, skill: string) => {
    setLocalData(prev => {
      const prevCat = (prev.skills as any)?.[category] || []
      const updated = prevCat.filter((x:any) => (typeof x === 'string' ? x : x.skill) !== skill)
      return { ...prev, skills: { ...prev.skills, [category]: updated } }
    })
  }

  const addCategorySkills = (category: string, skills: string[]) => {
    if (!skills || skills.length === 0) return
    setLocalData(prev => {
      const prevCat = (prev.skills as any)?.[category] || []
      const prevNames = prevCat.map((x:any) => (typeof x === 'string' ? x : x.skill))
      const toAdd = skills.filter(s => !prevNames.includes(s))
      if (toAdd.length === 0) return prev
      const updated = Array.isArray(prevCat) ? [...prevCat, ...toAdd] : [...toAdd]
      return { ...prev, skills: { ...prev.skills, [category]: updated } }
    })
  }

  const removeCategorySkills = (category: string, skills: string[]) => {
    if (!skills || skills.length === 0) return
    setLocalData(prev => {
      const prevCat = (prev.skills as any)?.[category] || []
      const updated = prevCat.filter((x:any) => !skills.includes(typeof x === 'string' ? x : x.skill))
      return { ...prev, skills: { ...prev.skills, [category]: updated } }
    })
  }
  
  const handleSuggestionAccept = (suggestionId: string) => {
    const suggestion = aiSuggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    console.log('🎯 Accepting suggestion for:', suggestion.section, suggestion.target_id)

    switch (suggestion.section) {
      case 'summary':
        setLocalData(prev => ({
          ...prev,
          professionalSummary: suggestion.suggestion
        }))
        break

      case 'title':
        setLocalData(prev => ({
          ...prev,
          professionalTitle: suggestion.suggestion
        }))
        break

      case 'experience':
        if (suggestion.experience_index !== undefined && suggestion.achievement_index !== undefined) {
          setLocalData(prev => {
            const newExp = [...(prev.experience || [])]
            if (newExp[suggestion.experience_index] && newExp[suggestion.experience_index].achievements) {
              newExp[suggestion.experience_index].achievements[suggestion.achievement_index] = suggestion.suggestion
            }
            return { ...prev, experience: newExp }
          })
        }
        break

      case 'skills':
        if (suggestion.suggestion && typeof suggestion.suggestion === 'object') {
          setLocalData(prev => ({
            ...prev,
            skills: { ...prev.skills, ...suggestion.suggestion }
          }))
        }
        break

      case 'projects':
        if (suggestion.project_index !== undefined) {
          setLocalData(prev => {
            const newProjects = [...(prev.projects || [])]
            if (newProjects[suggestion.project_index]) {
              newProjects[suggestion.project_index].description = suggestion.suggestion
            }
            return { ...prev, projects: newProjects }
          })
        }
        break

      default:
        console.warn('Unknown suggestion section:', suggestion.section)
        return
    }

    // Remove accepted suggestion and close suggestion panel
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    setSelectedSuggestion(null)
  }

  const handleSuggestionReject = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    setSelectedSuggestion(null)
  }

  const handleDataChange = (newData: any) => {
    setLocalData(newData)
    onDataChange?.(newData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  if (!localData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Found</h3>
          <p className="text-gray-600 mb-4">
            Please upload your resume first to start tailoring it for this job.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Resume
          </button>
        </div>
      </div>
    )
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
                <h1 className="text-xl font-bold text-gray-900">Resume Studio - Tailor Mode</h1>
                <p className="text-xs text-gray-500">AI-Powered Job Tailoring with Live Preview</p>
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
            
            {/* AI Suggestions Alert */}
            {aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">AI Suggestions Available</h3>
                    <p className="text-sm text-blue-700">
                      {aiSuggestions.length} suggestion{aiSuggestions.length > 1 ? 's' : ''} ready. Click highlighted text in preview to review.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
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
                {localData.enableProfessionalSummary && (
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
              badge={localData.experience?.length || 0}
              color="from-purple-500 to-pink-500"
              isExpanded={expandedSections.experience}
              onToggle={() => toggleSection('experience')}
              onAdd={() => {
                setLocalData({
                  ...localData,
                  experience: [...(localData.experience || []), {
                    position: '',
                    company: '',
                    duration: '',
                    achievements: ['']
                  }]
                })
              }}
            >
              <div className="space-y-4">
                {localData.experience?.map((exp, index) => (
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
                      </label>
                      {exp.achievements?.map((achievement, achIndex) => (
                        <div key={achIndex} className="flex items-start gap-2 mb-2">
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
                      ))}
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
                    
                    <CleanInput
                      label="Description"
                      value={project.description}
                      onChange={(value) => {
                        const newProjects = [...(localData.projects || [])]
                        newProjects[index].description = value
                        setLocalData({ ...localData, projects: newProjects })
                      }}
                      placeholder="Brief description of the project..."
                      multiline
                    />
                    
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
              {skillsSuggestion && skillDiff && (
                <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-indigo-800 text-sm">AI Skill Suggestions</div>
                    <button onClick={applySkillsSuggestion} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700">Apply All</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {Object.keys(skillDiff.added).length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-700">Add</div>
                        {Object.entries(skillDiff.added).map(([cat, arr]) => (
                          <div key={cat} className="mt-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[11px] text-gray-600">{cat}</div>
                              <button onClick={() => addCategorySkills(cat, arr as string[])} className="px-2 py-0.5 bg-green-600 text-white rounded text-[10px]">Apply category</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {arr.map((s:string) => (
                                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px]">
                                  {s}
                                  <button onClick={() => addSkill(cat, s)} className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px]">+</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.keys(skillDiff.removed).length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-red-700">Remove</div>
                        {Object.entries(skillDiff.removed).map(([cat, arr]) => (
                          <div key={cat} className="mt-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[11px] text-gray-600">{cat}</div>
                              <button onClick={() => removeCategorySkills(cat, arr as string[])} className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px]">Apply category</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {arr.map((s:string) => (
                                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px]">
                                  {s}
                                  <button onClick={() => removeSkill(cat, s)} className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]">–</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <EnhancedSkillsManager
                skills={localData.skills}
                onSkillsChange={(updatedSkills) => {
                  setLocalData({
                    ...localData,
                    skills: updatedSkills
                  })
                }}
                userProfile={userProfile}
                organizedSkills={localData?.skills ? convertSkillsToOrganizedFormat(localData.skills) : null}
                languages={userProfile?.languages || []}
                onLanguagesChange={(updatedLanguages) => {
                  console.log('🌍 Language change callback triggered:', updatedLanguages)
                  if (userProfile) {
                    const newUserProfile = { ...userProfile, languages: updatedLanguages }
                    setUserProfile(newUserProfile)
                    console.log('🌍 Updated userProfile with new languages:', newUserProfile.languages)
                  }
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
              badge={localData.education?.length || 0}
              isExpanded={expandedSections.education}
              onToggle={() => toggleSection('education')}
              color="from-amber-500 to-yellow-500"
              onAdd={() => {
                setLocalData({
                  ...localData,
                  education: [...(localData.education || []), {
                    degree: '',
                    field_of_study: '',
                    institution: '',
                    duration: ''
                  }]
                })
              }}
            >
              <div className="space-y-4">
                {localData.education?.length > 0 ? (
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
                          education: [...(localData.education || []), {
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
                                {name === 'Professional Memberships' && 'Professional organizations and memberships'}
                                {name === 'Speaking Engagements' && 'Conferences, talks, and presentations'}
                                {name === 'Hobbies & Interests' && 'Personal interests and activities'}
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
            {localData.customSections?.map((section, sectionIndex) => {
              const template = CUSTOM_SECTION_TEMPLATES[section.title as keyof typeof CUSTOM_SECTION_TEMPLATES]
              return (
                <SectionCard
                  key={section.id}
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
        <div className="w-[60%] bg-gray-100 flex items-center justify-center p-4 relative">
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
        
        {/* Inline Suggestion Overlay */}
        {selectedSuggestion && (
          <InlineSuggestion
            suggestion={selectedSuggestion}
            onAccept={() => handleSuggestionAccept(selectedSuggestion.id)}
            onReject={() => handleSuggestionReject(selectedSuggestion.id)}
            position={suggestionPosition}
          />
        )}
      </div>
    </div>
  )
}
