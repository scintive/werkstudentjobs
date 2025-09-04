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
  PenTool,
  Zap,
  Brain,
  Eye,
  Edit3
} from 'lucide-react'
import { ResumeDataService } from '@/lib/services/resumeDataService'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { TailorEnhancedRichText } from './TailorEnhancedRichText'
import { TailorSimpleTemplateDropdown } from './TailorSimpleTemplateDropdown'
import { TailorEnhancedSkillsManager } from './TailorEnhancedSkillsManager'
// Debug inspector removed for production cleanliness

// AI Suggestion Types for Tailor Integration
interface AISuggestion {
  id: string
  type: 'bullet' | 'skill' | 'experience' | 'summary'
  section: string
  original: string
  suggestion: string
  confidence: number
  keywords: string[]
  impact: 'high' | 'medium' | 'low'
  reason: string
}

interface TailorPerfectStudioProps {
  jobData?: any
  strategy?: any
  resumeData?: any
  patches?: any[]
  onPatchesChange?: (patches: any[]) => void
  aiSuggestions?: AISuggestion[]
  onSuggestionAccept?: (suggestionId: string) => void
  onSuggestionReject?: (suggestionId: string) => void
  onResumeDataLoaded?: (resumeData: any) => void
  suggestionsLoading?: boolean
}

// Custom Section Templates with AI Enhancement
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

// AI Suggestion Bubble Component
const AISuggestionBubble = ({ 
  suggestion, 
  onAccept, 
  onReject 
}: { 
  suggestion: AISuggestion
  onAccept: () => void
  onReject: () => void 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-0 right-0 z-50 w-72 bg-white border border-gray-300 rounded-lg shadow-lg"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">AI Suggestion</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              suggestion.impact === 'high' ? 'bg-green-100 text-green-700' :
              suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            )}>
              {suggestion.impact}
            </span>
            <span className="text-xs text-gray-500">{suggestion.confidence}%</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Original:</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 border">
              {suggestion.original}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Enhanced:</p>
            <p className="text-sm text-gray-900 bg-blue-50 rounded p-2 border border-blue-200">
              {suggestion.suggestion}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Reasoning:</p>
            <p className="text-xs text-gray-600">{suggestion.reason}</p>
          </div>
          
          {suggestion.keywords.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.keywords.map((keyword, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            Accept
          </button>
          
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced Section Card with AI Integration
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
  aiSuggestions?: AISuggestion[]
  onSuggestionAccept?: (suggestionId: string) => void
  onSuggestionReject?: (suggestionId: string) => void
}

const TailorSectionCard = ({ 
  title, 
  icon, 
  children, 
  badge,
  onAdd,
  className = '',
  color = 'from-blue-500 to-purple-500',
  isExpanded = true,
  onToggle,
  aiSuggestions = [],
  onSuggestionAccept,
  onSuggestionReject
}: SectionCardProps) => {
  const [showingSuggestion, setShowingSuggestion] = React.useState<string | null>(null)
  
  const relevantSuggestions = aiSuggestions.filter(s => 
    s.section.toLowerCase() === title.toLowerCase()
  )
  
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg card-hover', className)}>
      {/* AI Suggestion Overlay */}
      <AnimatePresence>
        {showingSuggestion && relevantSuggestions.find(s => s.id === showingSuggestion) && (
          <AISuggestionBubble
            suggestion={relevantSuggestions.find(s => s.id === showingSuggestion)!}
            onAccept={() => {
              onSuggestionAccept?.(showingSuggestion)
              setShowingSuggestion(null)
            }}
            onReject={() => {
              onSuggestionReject?.(showingSuggestion)
              setShowingSuggestion(null)
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-gray-600">
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {badge !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                {badge}
              </span>
            )}
            
            {/* AI Suggestions Indicator */}
            {relevantSuggestions.length > 0 && (
              <button
                onClick={() => setShowingSuggestion(relevantSuggestions[0].id)}
                className="relative w-5 h-5 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Brain className="w-3 h-3 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{relevantSuggestions.length}</span>
                </div>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onAdd && (
              <button
                onClick={onAdd}
                className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            )}
            
            {onToggle && (
              <button
                onClick={onToggle}
                className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && children}
      </div>
    </div>
  )
}

// Main Tailor Perfect Studio Component
export const TailorPerfectStudio = ({
  jobData,
  strategy,
  resumeData: propResumeData,
  patches = [],
  onPatchesChange,
  aiSuggestions = [],
  onSuggestionAccept,
  onSuggestionReject,
  onResumeDataLoaded,
  suggestionsLoading = false
}: TailorPerfectStudioProps) => {
  // Load real resume data from Supabase
  const [resumeData, setResumeData] = React.useState<any>(propResumeData || null)
  const [loading, setLoading] = React.useState(!propResumeData)
  const [forceRender, setForceRender] = React.useState(0)
  const [previewHtml, setPreviewHtml] = React.useState('')
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false)
  
  // Update local state when prop changes
  React.useEffect(() => {
    if (propResumeData) {
      setResumeData(propResumeData);
      setLoading(false);
    }
  }, [propResumeData]);

  // Force debug on resumeData changes
  React.useEffect(() => {
    if (resumeData?.personalInfo?.name) {
      setForceRender(prev => prev + 1);
    }
  }, [resumeData])
  const [activeTemplate, setActiveTemplate] = React.useState('swiss')
  const [zoom, setZoom] = React.useState(0.8)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const savedScrollPosition = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  
  // Load resume data on mount
  React.useEffect(() => {
    const loadResumeData = async () => {
      try {
        // If we already have prop data, skip loading
        if (propResumeData) {
          return;
        }
        
        // Clear any potential localStorage conflicts
        localStorage.removeItem('resume_session_id');
        localStorage.removeItem('resume_data');
        if (userProfile) {
          const convertedData = {
            personalInfo: {
              name: userProfile.personal_details?.name || '',
              email: userProfile.personal_details?.contact?.email || '',
              phone: userProfile.personal_details?.contact?.phone || '',
              location: userProfile.personal_details?.contact?.address || '',
              linkedin: userProfile.personal_details?.contact?.linkedin || '',
              website: ''
            },
            professionalTitle: userProfile.professional_title || '',
            professionalSummary: userProfile.professional_summary || '',
            enableProfessionalSummary: !!userProfile.professional_summary,
            skills: userProfile.skills || {},
            experience: userProfile.experience || [],
            education: userProfile.education || [],
            projects: userProfile.projects || [],
            languages: (userProfile.languages || []).map((lang: any) => {
              if (typeof lang === 'string') {
                // Parse string format like "English (Fluent (Native-level))"
                const match = lang.match(/^([^(]+)\s*\(([^)]+)\)$/);
                if (match) {
                  return {
                    language: match[1].trim(),
                    proficiency: match[2].trim()
                  };
                }
                // Fallback if no parentheses found
                return {
                  language: lang.trim(),
                  proficiency: 'Not specified'
                };
              } else {
                // Already structured object
                return {
                  language: lang.language || lang,
                  proficiency: lang.proficiency || 'Not specified'
                };
              }
            }),
            certifications: userProfile.certifications || [],
            customSections: (userProfile.custom_sections || []).map((section: any, index: number) => {
              
              // Helper function to intelligently parse custom section items based on title
              const parseCustomSectionItem = (item: string, sectionTitle: string) => {
                // Handle format: "Role, Organization (Duration) — Description"
                const match = item.match(/^(.*?),\s*(.*?)\s*\(([^)]+)\)\s*[—-]\s*(.*)$/);
                if (match) {
                  return {
                    field1: match[1].trim(), // Role/Position
                    field2: match[2].trim(), // Organization  
                    field3: match[3].trim(), // Duration
                    field4: match[4].trim()  // Impact/Description
                  };
                }
                
                // Default: Put entire item in field1
                return {
                  field1: item,
                  field2: '',
                  field3: '',
                  field4: ''
                };
              };
              
              return {
                id: `custom-${index}`,
                title: section.title,
                type: 'custom',
                items: section.items.map((item: string) => parseCustomSectionItem(item, section.title))
              }
            })
          };
          setResumeData(convertedData);
          
          if (onResumeDataLoaded) {
            onResumeDataLoaded(convertedData);
          }
          setLoading(false);
          return;
        }
        
        // Try multiple data sources
        const resumeService = ResumeDataService.getInstance()
        const sessionId = localStorage.getItem('resume_session_id')
        
        // Track data loading across multiple sources
        let currentData = resumeData;
        
        // SKIP ResumeDataService to avoid session conflicts - go directly to API
        
        
        // ALWAYS fetch from API to ensure fresh data (not checking currentData)
        // This prevents stale/cached data issues
        try {
          
          const { data: s } = await supabase.auth.getSession()
          const token = s.session?.access_token
          const response = await fetch('/api/profile/latest', {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.resumeData) {
              setResumeData(data.resumeData);
              currentData = data.resumeData;
              if (onResumeDataLoaded) {
                onResumeDataLoaded(data.resumeData);
              }
            } else {
              setResumeData(null);
            }
          } else {
            setResumeData(null);
          }
        } catch (error) {
          setResumeData(null);
        }
      } catch (error) {
        setResumeData(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadResumeData()
  }, [propResumeData])
  
  const updateResumeData = (updates: any) => {
    setResumeData(prev => ({ ...prev, ...updates }))
    // Trigger preview update after data change
    generatePreview({ ...resumeData, ...updates })
  }
  
  // Generate live preview with debouncing
  const generatePreview = React.useCallback((data: any) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Save scroll position before regenerating
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
    
    setIsGeneratingPreview(true)
    
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/resume/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeData: data,
            template: activeTemplate,
            showSkillLevelsInResume: false
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          setPreviewHtml(result.html)
        }
      } catch (error) {
        console.error('Preview generation failed:', error)
      } finally {
        setIsGeneratingPreview(false)
      }
    }, 800)
  }, [activeTemplate])
  
  // Generate initial preview when data loads
  React.useEffect(() => {
    if (resumeData && !loading) {
      generatePreview(resumeData)
    }
  }, [resumeData, loading, generatePreview])
  
  // Restore scroll position after preview updates
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
      
      iframe.onload = () => setTimeout(restoreScroll, 100)
      setTimeout(restoreScroll, 100)
    }
  }, [previewHtml])
  
  const saveResume = async () => {
    console.log('Saving resume...', resumeData)
  }
  
  const generatePDF = async () => {
    console.log('Generating PDF...', resumeData)
  }
  
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    skills: true,
    education: true,
    projects: true,
    certifications: true,
    custom: true
  })
  
  const [showPreview, setShowPreview] = React.useState(true)
  const [aiMode, setAiMode] = React.useState(true)
  
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }
  
  if (!resumeData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Found</h3>
          <p className="text-gray-600 mb-4">
            Please upload your resume first to start tailoring it for this job.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="w-4 h-4" />
            Upload Resume
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug UI removed */}
      
      {/* Swiss Precision Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Diamond className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Resume Studio</h1>
              {jobData && (
                <p className="text-sm text-gray-600">
                  {jobData.title}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiMode(!aiMode)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                aiMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              AI {aiMode ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
            >
              {showPreview ? 'Hide' : 'Preview'}
            </button>
          </div>
        </div>
        
        {aiSuggestions.length > 0 && aiMode && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{aiSuggestions.length} suggestions</span>
            <div className="flex gap-1 ml-2">
              {aiSuggestions.slice(0, 3).map(suggestion => (
                <span
                  key={suggestion.id}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    suggestion.impact === 'high' ? 'bg-green-100 text-green-700' :
                    suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  )}
                >
                  {suggestion.type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Layout: Editor + Preview */}
      <div className={cn(
        'px-6 grid gap-6',
        showPreview ? 'grid-cols-1 xl:grid-cols-[400px_1fr]' : 'grid-cols-1'
      )}>
        {/* Editor Column */}
        <div className="space-y-4" key={`editor-${forceRender}`}>
          {/* Personal Information */}
          <TailorSectionCard
            title="Personal Information"
            icon={<User className="w-6 h-6" />}
            badge={Object.keys(resumeData.personalInfo || {}).filter(key => 
              resumeData.personalInfo?.[key as keyof typeof resumeData.personalInfo]
            ).length}
            color="from-blue-500 to-cyan-500"
            isExpanded={expandedSections.personal}
            onToggle={() => toggleSection('personal')}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            {/* Personal Info Editor Content */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <TailorEnhancedRichText
                  value={resumeData.personalInfo?.name || ''}
                  onChange={(value) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, name: value } 
                  })}
                  placeholder="Your full name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo?.email || ''}
                  onChange={(e) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, email: e.target.value } 
                  })}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Debug line removed */}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <TailorEnhancedRichText
                  value={resumeData.personalInfo?.phone || ''}
                  onChange={(value) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, phone: value } 
                  })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <TailorEnhancedRichText
                  value={resumeData.personalInfo?.location || ''}
                  onChange={(value) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, location: value } 
                  })}
                  placeholder="City, State/Country"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
                <TailorEnhancedRichText
                  value={resumeData.personalInfo?.linkedin || ''}
                  onChange={(value) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, linkedin: value } 
                  })}
                  placeholder="linkedin.com/in/yourprofile"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                <TailorEnhancedRichText
                  value={resumeData.personalInfo?.website || ''}
                  onChange={(value) => updateResumeData({ 
                    personalInfo: { ...resumeData.personalInfo, website: value } 
                  })}
                  placeholder="yourwebsite.com"
                  className="w-full"
                />
              </div>
            </div>
          </TailorSectionCard>
          
          {/* Certifications */}
          <TailorSectionCard
            title="Certifications"
            icon={<Award className="w-5 h-5" />}
            badge={resumeData.certifications?.length || 0}
            isExpanded={expandedSections.certifications}
            onToggle={() => toggleSection('certifications')}
            onAdd={() => {
              const newCert = { name: '', issuer: '', date: '' }
              updateResumeData({ certifications: [...(resumeData.certifications || []), newCert] })
            }}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <div className="space-y-4">
              {(resumeData.certifications || []).map((cert: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Certification</label>
                      <TailorEnhancedRichText
                        value={cert.name || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.certifications || [])]
                          updated[index] = { ...updated[index], name: value }
                          updateResumeData({ certifications: updated })
                        }}
                        placeholder="e.g., AWS Certified Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Issuer</label>
                      <TailorEnhancedRichText
                        value={cert.issuer || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.certifications || [])]
                          updated[index] = { ...updated[index], issuer: value }
                          updateResumeData({ certifications: updated })
                        }}
                        placeholder="e.g., Amazon Web Services"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <TailorEnhancedRichText
                        value={cert.date || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.certifications || [])]
                          updated[index] = { ...updated[index], date: value }
                          updateResumeData({ certifications: updated })
                        }}
                        placeholder="e.g., Jan 2024"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(resumeData.certifications || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No certifications added yet</p>
                </div>
              )}
            </div>
          </TailorSectionCard>

          {/* Custom Sections (Volunteer, Awards, etc.) */}
          <TailorSectionCard
            title="Custom Sections"
            icon={<Diamond className="w-5 h-5" />}
            isExpanded={expandedSections.custom}
            onToggle={() => toggleSection('custom')}
            onAdd={() => {
              const newSection = {
                id: `custom-${Date.now()}`,
                title: 'Volunteer Experience',
                type: 'custom',
                items: [{ field1: '', field2: '', field3: '', field4: '' }]
              }
              updateResumeData({ customSections: [...(resumeData.customSections || []), newSection] })
            }}
          >
            <div className="space-y-4">
              {(resumeData.customSections || []).map((section: any, sIndex: number) => (
                <div key={section.id || sIndex} className="p-3 bg-gray-50 rounded border">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Section Title</label>
                      <TailorEnhancedRichText
                        value={section.title || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.customSections || [])]
                          updated[sIndex] = { ...updated[sIndex], title: value }
                          updateResumeData({ customSections: updated })
                        }}
                        placeholder="e.g., Volunteer Experience"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(section.items || []).map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="grid grid-cols-2 gap-3 p-2 bg-white rounded border">
                        <TailorEnhancedRichText
                          value={item.field1 || ''}
                          onChange={(value) => {
                            const updated = [...(resumeData.customSections || [])]
                            const items = [...(updated[sIndex].items || [])]
                            items[itemIndex] = { ...items[itemIndex], field1: value }
                            updated[sIndex] = { ...updated[sIndex], items }
                            updateResumeData({ customSections: updated })
                          }}
                          placeholder="Field 1"
                        />
                        <TailorEnhancedRichText
                          value={item.field2 || ''}
                          onChange={(value) => {
                            const updated = [...(resumeData.customSections || [])]
                            const items = [...(updated[sIndex].items || [])]
                            items[itemIndex] = { ...items[itemIndex], field2: value }
                            updated[sIndex] = { ...updated[sIndex], items }
                            updateResumeData({ customSections: updated })
                          }}
                          placeholder="Field 2"
                        />
                        <TailorEnhancedRichText
                          value={item.field3 || ''}
                          onChange={(value) => {
                            const updated = [...(resumeData.customSections || [])]
                            const items = [...(updated[sIndex].items || [])]
                            items[itemIndex] = { ...items[itemIndex], field3: value }
                            updated[sIndex] = { ...updated[sIndex], items }
                            updateResumeData({ customSections: updated })
                          }}
                          placeholder="Field 3"
                        />
                        <TailorEnhancedRichText
                          value={item.field4 || ''}
                          onChange={(value) => {
                            const updated = [...(resumeData.customSections || [])]
                            const items = [...(updated[sIndex].items || [])]
                            items[itemIndex] = { ...items[itemIndex], field4: value }
                            updated[sIndex] = { ...updated[sIndex], items }
                            updateResumeData({ customSections: updated })
                          }}
                          placeholder="Field 4 (details)"
                          multiline
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const updated = [...(resumeData.customSections || [])]
                        const items = [...(updated[sIndex].items || []), { field1: '', field2: '', field3: '', field4: '' }]
                        updated[sIndex] = { ...updated[sIndex], items }
                        updateResumeData({ customSections: updated })
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              ))}
              {(resumeData.customSections || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Diamond className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No custom sections yet. Click + to add Volunteer, Awards, or more.</p>
                </div>
              )}
            </div>
          </TailorSectionCard>

          {/* Professional Summary */}
          <TailorSectionCard
            title="Professional Summary"
            icon={<PenTool className="w-5 h-5" />}
            isExpanded={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <div>
              <TailorEnhancedRichText
                value={resumeData.professionalSummary || ''}
                onChange={(value) => updateResumeData({ professionalSummary: value })}
                placeholder="Professional summary highlighting key strengths and objectives"
                multiline
                className="min-h-[80px]"
              />
              {aiMode && strategy?.positioning?.elevator_pitch && (
                <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">AI Suggestion:</span>
                  </div>
                  <p className="text-xs text-blue-700 mb-2">
                    {strategy.positioning.elevator_pitch}
                  </p>
                  <button
                    onClick={() => updateResumeData({ professionalSummary: strategy.positioning.elevator_pitch })}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Use suggestion
                  </button>
                </div>
              )}
            </div>
          </TailorSectionCard>
          
          {/* Skills & Languages - Enhanced with AI */}
          <TailorSectionCard
            title="Skills & Languages"
            icon={<Star className="w-5 h-5" />}
            isExpanded={expandedSections.skills}
            onToggle={() => toggleSection('skills')}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <TailorEnhancedSkillsManager
              skills={resumeData.skills || {}}
              onSkillsChange={(skills) => updateResumeData({ skills })}
              jobData={jobData}
              strategy={strategy}
              aiMode={aiMode}
              languages={(resumeData.skills?.languages || []).map((l: string) => {
                const m = typeof l === 'string' && l.match(/^([^()]+)\s*\(([^)]+)\)/)
                return m ? { language: m[1].trim(), proficiency: m[2].trim() } : { language: String(l), proficiency: 'Not specified' }
              })}
              onLanguagesChange={(langs) => {
                const asStrings = langs.map(l => `${l.language}${l.proficiency && l.proficiency !== 'Not specified' ? ` (${l.proficiency})` : ''}`)
                updateResumeData({ skills: { ...resumeData.skills, languages: asStrings } })
              }}
            />
          </TailorSectionCard>
          
          {/* Experience */}
          <TailorSectionCard
            title="Experience"
            icon={<Briefcase className="w-5 h-5" />}
            badge={resumeData.experience?.length || 0}
            isExpanded={expandedSections.experience}
            onToggle={() => toggleSection('experience')}
            onAdd={() => {
              const newExp = {
                id: Date.now().toString(),
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                description: '',
                highlights: ['']
              }
              updateResumeData({
                experience: [...(resumeData.experience || []), newExp]
              })
            }}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <div className="space-y-4">
              {(resumeData.experience || []).map((exp: any, index: number) => (
                <div key={exp.id || index} className="p-3 bg-gray-50 rounded border">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                      <TailorEnhancedRichText
                        value={exp.company || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.experience || [])]
                          updated[index] = { ...updated[index], company: value }
                          updateResumeData({ experience: updated })
                        }}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                      <TailorEnhancedRichText
                        value={exp.position || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.experience || [])]
                          updated[index] = { ...updated[index], position: value }
                          updateResumeData({ experience: updated })
                        }}
                        placeholder="Job title"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                      <TailorEnhancedRichText
                        value={
                          exp.startDate || (exp.duration ? (exp.duration.split('–')[0] || exp.duration.split('-')[0] || '').trim() : '')
                        }
                        onChange={(value) => {
                          const updated = [...(resumeData.experience || [])]
                          const end = updated[index].endDate || (updated[index].duration ? (updated[index].duration.split('–')[1] || updated[index].duration.split('-')[1] || '').trim() : '')
                          updated[index] = { 
                            ...updated[index], 
                            startDate: value,
                            duration: [value, end].filter(Boolean).join(' – ')
                          }
                          updateResumeData({ experience: updated })
                        }}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                      <TailorEnhancedRichText
                        value={
                          exp.endDate || (exp.duration ? (exp.duration.split('–')[1] || exp.duration.split('-')[1] || '').trim() : '')
                        }
                        onChange={(value) => {
                          const updated = [...(resumeData.experience || [])]
                          const start = updated[index].startDate || (updated[index].duration ? (updated[index].duration.split('–')[0] || updated[index].duration.split('-')[0] || '').trim() : '')
                          updated[index] = { 
                            ...updated[index], 
                            endDate: value,
                            duration: [start, value].filter(Boolean).join(' – ')
                          }
                          updateResumeData({ experience: updated })
                        }}
                        placeholder="MM/YYYY or Present"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Responsibilities & Achievements</label>
                    {(exp.achievements && exp.achievements.length > 0 ? exp.achievements : (exp.description ? String(exp.description).split('\n').filter(Boolean) : ['']))
                      .map((line: string, achIndex: number) => (
                        <div key={achIndex} className="flex items-start gap-2 mb-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <TailorEnhancedRichText
                            value={line}
                            onChange={(value) => {
                              const updated = [...(resumeData.experience || [])]
                              const ach = [...(updated[index].achievements || (updated[index].description ? String(updated[index].description).split('\n').filter(Boolean) : []))]
                              ach[achIndex] = value
                              updated[index] = {
                                ...updated[index],
                                achievements: ach,
                                description: ach.join('\n')
                              }
                              updateResumeData({ experience: updated })
                            }}
                            placeholder="Bullet point"
                            className="flex-1"
                          />
                          <button
                            onClick={() => {
                              const updated = [...(resumeData.experience || [])]
                              const ach = [...(updated[index].achievements || (updated[index].description ? String(updated[index].description).split('\n').filter(Boolean) : []))]
                              ach.splice(achIndex, 1)
                              updated[index] = { ...updated[index], achievements: ach, description: ach.join('\n') }
                              updateResumeData({ experience: updated })
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => {
                        const updated = [...(resumeData.experience || [])]
                        const ach = [...(updated[index].achievements || (updated[index].description ? String(updated[index].description).split('\n').filter(Boolean) : [])), '']
                        updated[index] = { ...updated[index], achievements: ach, description: ach.join('\n') }
                        updateResumeData({ experience: updated })
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-2"
                    >
                      <Plus className="w-3 h-3" /> Add Bullet
                    </button>
                  </div>
                </div>
              ))}
              {(resumeData.experience || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No experience added yet</p>
                </div>
              )}
            </div>
          </TailorSectionCard>
          
          {/* Education */}
          <TailorSectionCard
            title="Education"
            icon={<GraduationCap className="w-5 h-5" />}
            badge={resumeData.education?.length || 0}
            isExpanded={expandedSections.education}
            onToggle={() => toggleSection('education')}
            onAdd={() => {
              const newEdu = {
                id: Date.now().toString(),
                institution: '',
                degree: '',
                field: '',
                graduationDate: '',
                gpa: '',
                honors: ''
              }
              updateResumeData({
                education: [...(resumeData.education || []), newEdu]
              })
            }}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <div className="space-y-4">
              {(resumeData.education || []).map((edu: any, index: number) => (
                <div key={edu.id || index} className="p-3 bg-gray-50 rounded border">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Institution</label>
                      <TailorEnhancedRichText
                        value={edu.institution || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.education || [])]
                          updated[index] = { ...updated[index], institution: value }
                          updateResumeData({ education: updated })
                        }}
                        placeholder="University/School name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
                      <TailorEnhancedRichText
                        value={edu.degree || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.education || [])]
                          updated[index] = { ...updated[index], degree: value }
                          updateResumeData({ education: updated })
                        }}
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Field of Study</label>
                      <TailorEnhancedRichText
                        value={edu.field || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.education || [])]
                          updated[index] = { ...updated[index], field: value }
                          updateResumeData({ education: updated })
                        }}
                        placeholder="Computer Science, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Graduation</label>
                      <TailorEnhancedRichText
                        value={edu.graduationDate || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.education || [])]
                          updated[index] = { ...updated[index], graduationDate: value }
                          updateResumeData({ education: updated })
                        }}
                        placeholder="MM/YYYY"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(resumeData.education || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No education added yet</p>
                </div>
              )}
            </div>
          </TailorSectionCard>
          
          {/* Projects */}
          <TailorSectionCard
            title="Projects"
            icon={<Code className="w-5 h-5" />}
            badge={resumeData.projects?.length || 0}
            isExpanded={expandedSections.projects}
            onToggle={() => toggleSection('projects')}
            onAdd={() => {
              const newProject = {
                id: Date.now().toString(),
                name: '',
                description: '',
                technologies: '',
                link: '',
                highlights: ['']
              }
              updateResumeData({
                projects: [...(resumeData.projects || []), newProject]
              })
            }}
            aiSuggestions={aiSuggestions}
            onSuggestionAccept={onSuggestionAccept}
            onSuggestionReject={onSuggestionReject}
          >
            <div className="space-y-4">
              {(resumeData.projects || []).map((project: any, index: number) => (
                <div key={project.id || index} className="p-3 bg-gray-50 rounded border">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Project Name</label>
                      <TailorEnhancedRichText
                        value={project.name || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.projects || [])]
                          updated[index] = { ...updated[index], name: value }
                          updateResumeData({ projects: updated })
                        }}
                        placeholder="Project name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Technologies</label>
                      <TailorEnhancedRichText
                        value={project.technologies || ''}
                        onChange={(value) => {
                          const updated = [...(resumeData.projects || [])]
                          updated[index] = { ...updated[index], technologies: value }
                          updateResumeData({ projects: updated })
                        }}
                        placeholder="React, Node.js, etc."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <TailorEnhancedRichText
                      value={project.description || ''}
                      onChange={(value) => {
                        const updated = [...(resumeData.projects || [])]
                        updated[index] = { ...updated[index], description: value }
                        updateResumeData({ projects: updated })
                      }}
                      placeholder="Project description and achievements"
                      multiline
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              ))}
              {(resumeData.projects || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Code className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No projects added yet</p>
                </div>
              )}
            </div>
          </TailorSectionCard>
        </div>
        
        {/* Preview Column */}
        {showPreview && (
          <div className="sticky top-24 h-fit">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
                  <div className="flex items-center gap-2">
                    <TailorSimpleTemplateDropdown 
                      activeTemplate={activeTemplate}
                      onChange={setActiveTemplate}
                    />
                    <select
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="text-xs border rounded px-2 py-1 text-gray-700 bg-white focus-soft"
                    >
                      <option value={0.75}>75%</option>
                      <option value={0.8}>80%</option>
                      <option value={0.9}>90%</option>
                      <option value={1}>100%</option>
                      <option value={1.1}>110%</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="h-[700px] overflow-y-auto">
                {previewHtml ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    style={{ 
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      width: `${(1/zoom)*100}%`,
                      height: `${(1/zoom)*100}%`
                    }}
                  />
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {isGeneratingPreview ? (
                      <>
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm font-medium">Generating Preview...</p>
                      </>
                    ) : (
                      <>
                        <Crown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">Live Preview</p>
                        <p className="text-xs text-gray-400">Resume will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TailorPerfectStudio
